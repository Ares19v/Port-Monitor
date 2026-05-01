import subprocess
import threading
import os
import socket
import uuid
import time
from typing import Dict, Any, List

class WorkspaceRunner:
    def __init__(self):
        self.active_processes: Dict[str, Dict[str, Any]] = {}
        
    def find_free_port(self) -> int:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            return s.getsockname()[1]

    def _read_stream(self, stream, ws_id: str, stream_type: str):
        try:
            for line in iter(stream.readline, ''):
                if line and ws_id in self.active_processes:
                    self.active_processes[ws_id]['logs'].append(
                        f"[{stream_type}] {line.strip()}"
                    )
        except Exception:
            pass

    def start_workspace(self, name: str, commands: List[str], cwd: str = None) -> Dict[str, Any]:
        ws_id = str(uuid.uuid4())
        
        env = os.environ.copy()
        assigned_ports = []
        processes = []
        
        for cmd in commands:
            free_port = self.find_free_port()
            assigned_ports.append(free_port)
            env["PORT"] = str(free_port)
            
            try:
                # Use shell=True for windows to allow npm, python, etc.
                process = subprocess.Popen(
                    cmd,
                    shell=True,
                    cwd=cwd,
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1
                )
                processes.append({"cmd": cmd, "process": process, "port": free_port})
            except Exception as e:
                # Cleanup if one fails
                for p in processes:
                    p["process"].terminate()
                return {"success": False, "message": f"Failed to start {cmd}: {str(e)}"}
                
        self.active_processes[ws_id] = {
            "name": name,
            "processes": processes,
            "logs": [],
            "status": "running"
        }
        
        # Start log reading threads
        for p in processes:
            threading.Thread(target=self._read_stream, args=(p["process"].stdout, ws_id, "STDOUT"), daemon=True).start()
            threading.Thread(target=self._read_stream, args=(p["process"].stderr, ws_id, "STDERR"), daemon=True).start()
            
        return {
            "success": True, 
            "ws_id": ws_id, 
            "assigned_ports": assigned_ports,
            "message": f"Workspace '{name}' started successfully."
        }

    def stop_workspace(self, ws_id: str) -> Dict[str, Any]:
        if ws_id not in self.active_processes:
            return {"success": False, "message": "Workspace not found."}
            
        ws = self.active_processes[ws_id]
        for p in ws["processes"]:
            try:
                # On Windows, terminating shell=True might leave children. We can try taskkill
                pid = p["process"].pid
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception:
                pass
                
        ws["status"] = "stopped"
        del self.active_processes[ws_id]
        
        return {"success": True, "message": "Workspace stopped."}
        
    def get_workspaces(self) -> List[Dict[str, Any]]:
        result = []
        for ws_id, ws in self.active_processes.items():
            result.append({
                "id": ws_id,
                "name": ws["name"],
                "status": ws["status"],
                "ports": [p["port"] for p in ws["processes"]],
                "commands": [p["cmd"] for p in ws["processes"]]
            })
        return result
        
    def get_logs(self, ws_id: str) -> Dict[str, Any]:
        if ws_id not in self.active_processes:
            return {"success": False, "message": "Workspace not found."}
            
        # Return last 100 logs
        logs = self.active_processes[ws_id]["logs"][-100:]
        return {"success": True, "logs": logs}

runner = WorkspaceRunner()
