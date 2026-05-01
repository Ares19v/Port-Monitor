import socket
import select
import threading

active_forwards = {}

class PortForwarder(threading.Thread):
    def __init__(self, source_port, destination_port, destination_host='127.0.0.1'):
        super().__init__()
        self.source_port = source_port
        self.destination_port = destination_port
        self.destination_host = destination_host
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_socket.bind(('127.0.0.1', source_port))
        self.server_socket.listen(5)
        self.running = True

    def run(self):
        while self.running:
            try:
                self.server_socket.settimeout(1.0)
                try:
                    client_socket, addr = self.server_socket.accept()
                except socket.timeout:
                    continue
                    
                target_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                try:
                    target_socket.connect((self.destination_host, self.destination_port))
                    t1 = threading.Thread(target=self.forward, args=(client_socket, target_socket))
                    t2 = threading.Thread(target=self.forward, args=(target_socket, client_socket))
                    t1.start()
                    t2.start()
                except Exception as e:
                    client_socket.close()
            except Exception as e:
                break

    def forward(self, source, destination):
        try:
            while self.running:
                data = source.recv(4096)
                if not data:
                    break
                destination.send(data)
        except Exception:
            pass
        finally:
            source.close()
            destination.close()

    def stop(self):
        self.running = False
        try:
            self.server_socket.close()
        except:
            pass

def start_forward(source_port: int, target_port: int):
    if source_port in active_forwards:
        return {"success": False, "message": f"Port {source_port} is already being forwarded."}
    
    try:
        forwarder = PortForwarder(source_port, target_port)
        forwarder.start()
        active_forwards[source_port] = forwarder
        return {"success": True, "message": f"Forwarding localhost:{source_port} -> localhost:{target_port}"}
    except Exception as e:
        return {"success": False, "message": str(e)}

def stop_forward(source_port: int):
    if source_port not in active_forwards:
        return {"success": False, "message": "Forwarding rule not found."}
    
    forwarder = active_forwards.pop(source_port)
    forwarder.stop()
    return {"success": True, "message": f"Stopped forwarding on port {source_port}"}

def get_active_rules():
    rules = []
    for src, fw in active_forwards.items():
        rules.append({
            "source_port": src,
            "target_port": fw.destination_port
        })
    return rules
