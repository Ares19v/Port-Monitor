import psutil
import os
import signal

def get_active_ports():
    connections = psutil.net_connections(kind='inet')
    ports_info = []
    
    for conn in connections:
        if conn.status == 'LISTEN' or conn.status == 'ESTABLISHED':
            port = conn.laddr.port
            pid = conn.pid
            
            if not pid:
                continue
                
            try:
                process = psutil.Process(pid)
                process_name = process.name()
                
                ports_info.append({
                    "port": port,
                    "pid": pid,
                    "process_name": process_name,
                    "status": conn.status,
                    "protocol": "TCP" if conn.type == 1 else "UDP"
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
                
    return ports_info

def kill_process_by_pid(pid: int):
    try:
        process = psutil.Process(pid)
        process.kill() # Force kill for immediate effect
        process.wait(timeout=3)
        return {"success": True, "message": f"Process {pid} terminated."}
    except psutil.NoSuchProcess:
        return {"success": False, "message": f"Process {pid} not found."}
    except psutil.AccessDenied:
        return {"success": False, "message": f"Access denied to terminate process {pid}. Administrator privileges might be required."}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_process_details(pid: int):
    try:
        process = psutil.Process(pid)
        
        # IO Counters for "activity" chart
        io = process.io_counters() if hasattr(process, 'io_counters') else None
        
        # Dependency Tree
        children = []
        for child in process.children(recursive=True):
            try:
                children.append({"pid": child.pid, "name": child.name()})
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
                
        # Security Risk Score (Heuristic)
        # e.g., running as system/admin, binding to external ports
        risk_score = "Low"
        username = ""
        try:
            username = process.username()
            if "SYSTEM" in username or "Administrator" in username:
                risk_score = "Medium (Privileged)"
        except:
            pass
            
        return {
            "success": True,
            "pid": pid,
            "name": process.name(),
            "username": username,
            "io": {"read_bytes": io.read_bytes, "write_bytes": io.write_bytes} if io else None,
            "children": children,
            "risk_score": risk_score
        }
    except psutil.NoSuchProcess:
        return {"success": False, "message": "Process not found"}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_all_processes():
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'username', 'memory_info', 'cpu_percent']):
        try:
            mem_mb = proc.info['memory_info'].rss / (1024 * 1024) if proc.info['memory_info'] else 0
            processes.append({
                "pid": proc.info['pid'],
                "name": proc.info['name'] or "Unknown",
                "user": proc.info['username'] or "Unknown",
                "memory_mb": round(mem_mb, 1),
                "cpu": proc.info['cpu_percent'] or 0.0
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
            
    # Sort by memory descending
    processes.sort(key=lambda x: x['memory_mb'], reverse=True)
    return {"success": True, "processes": processes}

