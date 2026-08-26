import psutil
import subprocess
import time
import shutil
import datetime
import database
import alerts

last_io = None
last_net = None
last_time = time.time()
_boot_time = psutil.boot_time()

_cached_gpu = None
_last_gpu_check = 0.0

def has_nvidia_smi():
    return shutil.which("nvidia-smi") is not None

def get_gpu_stats():
    global _cached_gpu, _last_gpu_check
    if not has_nvidia_smi():
        return None
    
    # Throttle GPU queries to every 2 seconds to eliminate subprocess CPU overhead
    now = time.time()
    if _cached_gpu is not None and (now - _last_gpu_check) < 2.0:
        return _cached_gpu
        
    try:
        output = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu", "--format=csv,noheader,nounits"],
            text=True,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            timeout=1.5
        )
        parts = [p.strip() for p in output.strip().split(', ')]
        if len(parts) >= 5:
            _cached_gpu = {
                "name": parts[0],
                "utilization": float(parts[1]),
                "memory_used_mb": float(parts[2]),
                "memory_total_mb": float(parts[3]),
                "temp_c": float(parts[4])
            }
            _last_gpu_check = now
            return _cached_gpu
    except Exception:
        pass
    return _cached_gpu

def get_top_consumers():
    procs = []
    for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
        try:
            name = p.info['name'] or "Unknown"
            if name.lower() in ("system idle process", "idle"):
                continue
            mem_mb = p.info['memory_info'].rss / (1024 * 1024) if p.info['memory_info'] else 0
            procs.append({
                "pid": p.info['pid'],
                "name": name,
                "cpu": p.info['cpu_percent'] or 0.0,
                "memory_mb": round(mem_mb, 1)
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    
    top_cpu = sorted(procs, key=lambda x: x['cpu'], reverse=True)[:5]
    top_mem = sorted(procs, key=lambda x: x['memory_mb'], reverse=True)[:5]
    return {"top_cpu": top_cpu, "top_mem": top_mem}

def get_live_performance():
    global last_io, last_net, last_time
    
    current_time = time.time()
    dt = current_time - last_time if current_time > last_time else 1.0
    last_time = current_time
    
    # CPU total & per-core
    cpu_percent = psutil.cpu_percent(interval=None)
    cpu_cores = psutil.cpu_percent(interval=None, percpu=True)
    try:
        cpu_freq = psutil.cpu_freq().current / 1000.0 # GHz
    except:
        cpu_freq = 0.0
        
    # Memory
    mem = psutil.virtual_memory()
    
    # Disk I/O speed
    current_io = psutil.disk_io_counters()
    disk_read_bps = 0
    disk_write_bps = 0
    if last_io and current_io:
        disk_read_bps = max(0, (current_io.read_bytes - last_io.read_bytes) / dt)
        disk_write_bps = max(0, (current_io.write_bytes - last_io.write_bytes) / dt)
    last_io = current_io
    
    # Network I/O speed
    current_net = psutil.net_io_counters()
    net_recv_bps = 0
    net_sent_bps = 0
    if last_net and current_net:
        net_recv_bps = max(0, (current_net.bytes_recv - last_net.bytes_recv) / dt)
        net_sent_bps = max(0, (current_net.bytes_sent - last_net.bytes_sent) / dt)
    last_net = current_net
    
    # GPU
    gpu_stats = get_gpu_stats()
    
    # Uptime in human format
    uptime_secs = int(time.time() - _boot_time)
    hours, remainder = divmod(uptime_secs, 3600)
    minutes, seconds = divmod(remainder, 60)
    uptime_str = f"{hours}h {minutes}m"
    
    # Top resource consumers
    consumers = get_top_consumers()

    result = {
        "success": True,
        "uptime": uptime_str,
        "cpu": {
            "percent": cpu_percent,
            "cores": cpu_cores,
            "freq_ghz": round(cpu_freq, 2),
            "core_count": psutil.cpu_count(logical=True)
        },
        "memory": {
            "percent": mem.percent,
            "used_gb": round(mem.used / (1024**3), 1),
            "total_gb": round(mem.total / (1024**3), 1),
            "free_gb": round(mem.available / (1024**3), 1)
        },
        "disk": {
            "read_mbps": round(disk_read_bps / (1024**2), 2),
            "write_mbps": round(disk_write_bps / (1024**2), 2)
        },
        "network": {
            "recv_mbps": round((net_recv_bps * 8) / (1024**2), 2),
            "sent_mbps": round((net_sent_bps * 8) / (1024**2), 2)
        },
        "gpu": gpu_stats,
        "top_consumers": consumers
    }
    
    # Persist to SQLite and check alert thresholds
    try:
        database.insert_snapshot(result)
        alerts.check_and_alert(result)
    except Exception:
        pass
        
    return result

# Initialize psutil non-blocking calls
psutil.cpu_percent(percpu=True)
last_io = psutil.disk_io_counters()
last_net = psutil.net_io_counters()
