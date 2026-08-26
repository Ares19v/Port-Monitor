import psutil
import socket
import requests
import threading
from concurrent.futures import ThreadPoolExecutor
import database

_ip_cache = {}
_cache_lock = threading.Lock()
_executor = ThreadPoolExecutor(max_workers=10)

SUSPICIOUS_PORTS = {4444, 1234, 31337, 6666, 6667, 6668, 6669, 12345, 9001, 9002, 1337, 8888}

def _is_private(ip: str) -> bool:
    try:
        if ip in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
            return True
        parts = list(map(int, ip.split('.')))
        if len(parts) != 4:
            return True
        if parts[0] == 10: return True
        if parts[0] == 172 and 16 <= parts[1] <= 31: return True
        if parts[0] == 192 and parts[1] == 168: return True
        if parts[0] == 127: return True
        if parts[0] == 169 and parts[1] == 254: return True
        return False
    except Exception:
        return True

def _fetch_single_geoip(ip: str) -> dict:
    with _cache_lock:
        if ip in _ip_cache:
            return _ip_cache[ip]
            
    # Check SQLite persistent cache
    cached = database.get_cached_geoip(ip)
    if cached:
        with _cache_lock:
            _ip_cache[ip] = cached
        return cached

    try:
        res = requests.get(
            f'http://ip-api.com/json/{ip}?fields=country,city,isp,proxy,hosting',
            timeout=2.0
        )
        d = res.json()
        result = {
            'country': d.get('country', 'Unknown'),
            'city': d.get('city', 'Unknown'),
            'isp': d.get('isp', 'Unknown'),
            'is_proxy': bool(d.get('proxy', False)),
            'is_hosting': bool(d.get('hosting', False)),
        }
    except Exception:
        result = {'country': 'Unknown', 'city': 'Unknown', 'isp': 'Unknown', 'is_proxy': False, 'is_hosting': False}
        
    with _cache_lock:
        _ip_cache[ip] = result
        
    # Save to SQLite asynchronously
    database.save_cached_geoip(ip, result)
    return result

def get_network_security():
    try:
        connections = []
        seen = set()
        raw_conns = []

        for conn in psutil.net_connections(kind='inet'):
            if not conn.raddr:
                continue
            remote_ip = conn.raddr.ip
            remote_port = conn.raddr.port
            key = (remote_ip, remote_port, conn.pid)
            if key in seen:
                continue
            seen.add(key)
            raw_conns.append(conn)

        # Collect external IPs that need geolocation
        external_ips = list({c.raddr.ip for c in raw_conns if not _is_private(c.raddr.ip)})
        
        # Parallel resolution using ThreadPool
        geo_map = {}
        if external_ips:
            futures = {ip: _executor.submit(_fetch_single_geoip, ip) for ip in external_ips}
            for ip, fut in futures.items():
                try:
                    geo_map[ip] = fut.result(timeout=2.5)
                except Exception:
                    geo_map[ip] = {'country': 'Unknown', 'city': 'Unknown', 'isp': 'Unknown', 'is_proxy': False, 'is_hosting': False}

        # Process cache for names
        pid_name_map = {}
        for conn in raw_conns:
            if conn.pid and conn.pid not in pid_name_map:
                try:
                    pid_name_map[conn.pid] = psutil.Process(conn.pid).name()
                except Exception:
                    pid_name_map[conn.pid] = 'Unknown'

        for conn in raw_conns:
            remote_ip = conn.raddr.ip
            remote_port = conn.raddr.port
            process_name = pid_name_map.get(conn.pid, 'Unknown')
            private = _is_private(remote_ip)
            
            if private:
                geo = {'country': 'LAN', 'city': 'Private Network', 'isp': 'Local Loopback', 'is_proxy': False, 'is_hosting': False}
            else:
                geo = geo_map.get(remote_ip, {'country': 'Unknown', 'city': 'Unknown', 'isp': 'Unknown', 'is_proxy': False, 'is_hosting': False})

            risk = 'Low'
            risk_reasons = []
            if not private:
                risk = 'Medium'
                risk_reasons.append('External inbound/outbound')
            if geo.get('is_proxy'):
                risk = 'High'
                risk_reasons.append('VPN / Anonymous Proxy')
            if remote_port in SUSPICIOUS_PORTS:
                risk = 'High'
                risk_reasons.append(f'Suspicious Port ({remote_port})')
            if geo.get('is_hosting') and not private:
                risk_reasons.append('Datacenter / Cloud host')

            connections.append({
                'local_port': conn.laddr.port if conn.laddr else None,
                'remote_ip': remote_ip,
                'remote_port': remote_port,
                'status': conn.status,
                'pid': conn.pid,
                'process_name': process_name,
                'is_external': not private,
                'geo': geo,
                'risk': risk,
                'risk_reasons': risk_reasons,
            })

        risk_order = {'High': 0, 'Medium': 1, 'Low': 2}
        connections.sort(key=lambda x: (0 if x['is_external'] else 1, risk_order.get(x['risk'], 2)))
        return {'success': True, 'connections': connections}
    except Exception as e:
        return {'success': False, 'message': str(e), 'connections': []}
