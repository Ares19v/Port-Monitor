import psutil
import os
import signal
import socket
import datetime

COMMON_SERVICES = {
    80: {"service": "HTTP Web", "category": "Web"},
    443: {"service": "HTTPS Web", "category": "Web"},
    3000: {"service": "React / Next.js / Node", "category": "Frontend"},
    3001: {"service": "React / Node Dev", "category": "Frontend"},
    4200: {"service": "Angular CLI", "category": "Frontend"},
    5000: {"service": "Flask / Python", "category": "Backend"},
    5173: {"service": "Vite Dev Server", "category": "Frontend"},
    5174: {"service": "Vite Dev Secondary", "category": "Frontend"},
    5432: {"service": "PostgreSQL Database", "category": "Database"},
    3306: {"service": "MySQL Database", "category": "Database"},
    6379: {"service": "Redis Cache", "category": "Database"},
    8000: {"service": "FastAPI / Django / Dev Server", "category": "Backend"},
    8001: {"service": "Delphi / Microservice", "category": "Backend"},
    8080: {"service": "HTTP Proxy / Spring Boot", "category": "Backend"},
    8888: {"service": "Jupyter Notebook", "category": "Data Science"},
    9000: {"service": "PHP-FPM / SonarQube", "category": "Backend"},
    9200: {"service": "Elasticsearch", "category": "Database"},
    27017: {"service": "MongoDB", "category": "Database"},
}

def extract_project_info(process: psutil.Process) -> dict:
    """Extracts project directory, clean project name, and commandline from a process."""
    cwd = ""
    cmdline = ""
    project_name = ""

    try:
        cwd = process.cwd()
    except (psutil.AccessDenied, psutil.NoSuchProcess, Exception):
        pass

    try:
        cmdline = " ".join(process.cmdline())
    except (psutil.AccessDenied, psutil.NoSuchProcess, Exception):
        pass

    if cwd:
        norm = os.path.normpath(cwd)
        parts = norm.split(os.sep)
        # Search for Projects / Workspace directory pattern
        for i, part in enumerate(parts):
            if part.lower() in ("projects", "workspace", "workspaces", "repos", "code", "dev", "github") and i + 1 < len(parts):
                project_name = parts[i + 1]
                break

        if not project_name and len(parts) > 1:
            # If inside standard subfolders like /backend or /frontend, grab parent
            if parts[-1].lower() in ("backend", "frontend", "src", "dist", "build", "server", "client", "app", "ui", "dashboard") and len(parts) > 2:
                project_name = parts[-2]
            elif parts[-1] and parts[-1] != "\\":
                project_name = parts[-1]

    # Fallback to cmdline search if cwd is empty or system root
    if (not project_name or project_name.lower() in ("c:", "c:\\", "system32", "windows")) and cmdline:
        for token in cmdline.split():
            if "projects" in token.lower() or "workspace" in token.lower():
                parts = os.path.normpath(token).split(os.sep)
                for i, part in enumerate(parts):
                    if part.lower() in ("projects", "workspace", "repos") and i + 1 < len(parts):
                        project_name = parts[i + 1]
                        break

    return {
        "project_name": project_name if project_name and project_name not in ("C:", "C:\\", "System32", "Windows") else "",
        "cwd": cwd,
        "cmdline": cmdline[:200]
    }

def detect_service(port: int, process_name: str) -> dict:
    name_lower = (process_name or "").lower()
    if "node" in name_lower and port in (3000, 3001, 5173, 5174):
        return {"service": "Node.js Dev Server", "category": "Frontend"}
    if "python" in name_lower and port in (8000, 8001, 5000):
        return {"service": "Python API Server", "category": "Backend"}
    if "postgres" in name_lower:
        return {"service": "PostgreSQL Server", "category": "Database"}
    if "redis" in name_lower:
        return {"service": "Redis Server", "category": "Database"}
    if "mysqld" in name_lower or "mariadb" in name_lower:
        return {"service": "MySQL Server", "category": "Database"}
    if "docker" in name_lower or "com.docker" in name_lower:
        return {"service": "Docker Daemon", "category": "Container"}

    if port in COMMON_SERVICES:
        return COMMON_SERVICES[port]
    return {"service": "Custom Service", "category": "General"}

def get_active_ports():
    connections = psutil.net_connections(kind='inet')
    ports_info = []
    seen = set()

    for conn in connections:
        if conn.status in ('LISTEN', 'ESTABLISHED'):
            port = conn.laddr.port
            pid = conn.pid
            key = (port, pid, conn.status)
            if key in seen:
                continue
            seen.add(key)

            if not pid:
                continue

            try:
                process = psutil.Process(pid)
                process_name = process.name()
                mem_mb = round(process.memory_info().rss / (1024 * 1024), 1)
                
                # Service & Project detection
                svc_meta = detect_service(port, process_name)
                proj_info = extract_project_info(process)

                ports_info.append({
                    "port": port,
                    "pid": pid,
                    "process_name": process_name,
                    "project_name": proj_info.get("project_name") or "",
                    "cwd": proj_info.get("cwd") or "",
                    "cmdline": proj_info.get("cmdline") or "",
                    "service": svc_meta.get("service", "Unknown"),
                    "category": svc_meta.get("category", "General"),
                    "status": conn.status,
                    "protocol": "TCP" if conn.type == 1 else "UDP",
                    "memory_mb": mem_mb,
                    "create_time": datetime.datetime.fromtimestamp(process.create_time()).strftime("%H:%M:%S")
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

    # Sort listening ports first, then by port ascending
    ports_info.sort(key=lambda x: (0 if x['status'] == 'LISTEN' else 1, x['port']))
    return ports_info

def kill_process_by_pid(pid: int):
    try:
        process = psutil.Process(pid)
        name = process.name()
        process.kill()
        process.wait(timeout=2)
        return {"success": True, "message": f"Terminated {name} (PID {pid})."}
    except psutil.NoSuchProcess:
        return {"success": False, "message": f"Process {pid} not found."}
    except psutil.AccessDenied:
        return {"success": False, "message": f"Access denied to terminate process {pid}. Administrator privileges required."}
    except Exception as e:
        return {"success": False, "message": str(e)}

def kill_multiple_processes(pids: list):
    results = []
    for pid in pids:
        results.append(kill_process_by_pid(pid))
    success_count = sum(1 for r in results if r.get("success"))
    return {"success": True, "killed": success_count, "total": len(pids), "details": results}

def get_next_available_port(start_port: int = 3000, max_attempts: int = 100) -> int:
    """Finds the next unassigned TCP port starting from start_port."""
    for p in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.2)
            res = s.connect_ex(('127.0.0.1', p))
            if res != 0:
                return p
    return start_port + max_attempts

def get_process_details(pid: int):
    try:
        process = psutil.Process(pid)
        io = process.io_counters() if hasattr(process, 'io_counters') else None
        proj_info = extract_project_info(process)

        # Parent information
        parent_info = None
        try:
            parent = process.parent()
            if parent:
                parent_info = {"pid": parent.pid, "name": parent.name()}
        except Exception:
            pass

        # Dependency Tree (children)
        children = []
        for child in process.children(recursive=True):
            try:
                children.append({
                    "pid": child.pid,
                    "name": child.name(),
                    "memory_mb": round(child.memory_info().rss / (1024 * 1024), 1)
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        # Connections owned by this PID
        open_ports = []
        for c in process.connections(kind='inet'):
            if c.laddr:
                open_ports.append({"port": c.laddr.port, "status": c.status})

        username = ""
        try:
            username = process.username()
        except:
            pass

        return {
            "success": True,
            "pid": pid,
            "name": process.name(),
            "username": username,
            "project_name": proj_info.get("project_name") or "",
            "cwd": proj_info.get("cwd") or "",
            "cmdline": proj_info.get("cmdline") or "",
            "memory_mb": round(process.memory_info().rss / (1024 * 1024), 1),
            "cpu_percent": process.cpu_percent(interval=0.1),
            "create_time": datetime.datetime.fromtimestamp(process.create_time()).strftime("%Y-%m-%d %H:%M:%S"),
            "parent": parent_info,
            "children": children,
            "open_ports": open_ports,
            "io": {"read_bytes": io.read_bytes, "write_bytes": io.write_bytes} if io else None,
        }
    except psutil.NoSuchProcess:
        return {"success": False, "message": "Process not found"}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_all_processes(limit: int = 150):
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
    return {"success": True, "processes": processes[:limit], "total_count": len(processes)}
