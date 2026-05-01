import psutil
import subprocess
import time
import shutil
import database
import alerts

last_io = None
last_net = None
last_time = time.time()

def has_nvidia_smi():
    return shutil.which("nvidia-smi") is not None

def get_gpu_stats():
    if not has_nvidia_smi():
        return None
        
    try:
        # Get utilization.gpu, memory.used, memory.total
        # CREATE_NO_WINDOW prevents the console flash on Windows
        output = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu", "--format=csv,noheader,nounits"],
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        parts = output.strip().split(', ')
        if len(parts) >= 4:
            return {
                "utilization": float(parts[0]),
                "memory_used_mb": float(parts[1]),
                "memory_total_mb": float(parts[2]),
                "temp_c": float(parts[3])
            }
    except Exception:
        pass
    return None

def get_live_performance():
    global last_io, last_net, last_time
    
    current_time = time.time()
    dt = current_time - last_time if current_time > last_time else 1.0
    last_time = current_time
    
    # CPU
    cpu_percent = psutil.cpu_percent(interval=None) # Non-blocking
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
    
    result = {
        "success": True,
        "cpu": {
            "percent": cpu_percent,
            "freq_ghz": round(cpu_freq, 2)
        },
        "memory": {
            "percent": mem.percent,
            "used_gb": round(mem.used / (1024**3), 1),
            "total_gb": round(mem.total / (1024**3), 1)
        },
        "disk": {
            "read_mbps": round(disk_read_bps / (1024**2), 2),
            "write_mbps": round(disk_write_bps / (1024**2), 2)
        },
        "network": {
            "recv_mbps": round((net_recv_bps * 8) / (1024**2), 2),
            "sent_mbps": round((net_sent_bps * 8) / (1024**2), 2)
        },
        "gpu": gpu_stats
    }
    # Persist to SQLite and check alert thresholds
    try:
        database.insert_snapshot(result)
        alerts.check_and_alert(result)
    except Exception:
        pass
    return result

# Initialize psutil non-blocking calls
psutil.cpu_percent()
last_io = psutil.disk_io_counters()
last_net = psutil.net_io_counters()
