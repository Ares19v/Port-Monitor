import psutil
import socket
import requests
import threading

_ip_cache = {}
_cache_lock = threading.Lock()

SUSPICIOUS_PORTS = {4444, 1234, 31337, 6666, 6667, 6668, 6669, 12345, 9001, 9002}

def _is_private(ip: str) -> bool:
    try:
        parts = list(map(int, ip.split('.')))
        if parts[0] == 10: return True
        if parts[0] == 172 and 16 <= parts[1] <= 31: return True
        if parts[0] == 192 and parts[1] == 168: return True
        if parts[0] == 127: return True
        return False
    except Exception:
        return True

def _geolocate(ip: str) -> dict:
    with _cache_lock:
        if ip in _ip_cache:
            return _ip_cache[ip]
    try:
        res = requests.get(
            f'http://ip-api.com/json/{ip}?fields=country,city,isp,proxy,hosting',
            timeout=3
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
    return result

def get_network_security():
    try:
        connections = []
        seen = set()

        for conn in psutil.net_connections(kind='inet'):
            if not conn.raddr:
                continue
            remote_ip = conn.raddr.ip
            remote_port = conn.raddr.port
            key = (remote_ip, remote_port, conn.pid)
            if key in seen:
                continue
            seen.add(key)

            process_name = 'Unknown'
            if conn.pid:
                try:
                    process_name = psutil.Process(conn.pid).name()
                except Exception:
                    pass

            private = _is_private(remote_ip)
            geo = {'country': 'LAN', 'city': 'Private', 'isp': 'Local', 'is_proxy': False, 'is_hosting': False}
            if not private:
                geo = _geolocate(remote_ip)

            risk = 'Low'
            risk_reasons = []
            if not private:
                risk = 'Medium'
                risk_reasons.append('External connection')
            if geo.get('is_proxy'):
                risk = 'High'
                risk_reasons.append('VPN/Proxy endpoint')
            if remote_port in SUSPICIOUS_PORTS:
                risk = 'High'
                risk_reasons.append(f'Port {remote_port} flagged as suspicious')

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
