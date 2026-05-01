from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
import os, sys, json, asyncio
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import core, forwarder, hardware, orchestrator, performance
import network_security, project_scanner, startup_manager, alerts, database, report_generator

# Init DB on startup
database.init_db()

app = FastAPI(title="Port-Monitor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Docker / Nginx
        "http://127.0.0.1:8000", # pywebview packaged app
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Ports ──────────────────────────────────────────────────────────────────────
@app.get("/api/ports", response_model=List[Dict[str, Any]])
def get_ports(): return core.get_active_ports()

@app.post("/api/process/{pid}/kill")
def kill_process(pid: int):
    result = core.kill_process_by_pid(pid)
    if not result["success"]: raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.get("/api/process/{pid}")
def get_process_info(pid: int):
    result = core.get_process_details(pid)
    if not result["success"]: raise HTTPException(status_code=404, detail=result.get("message"))
    return result

@app.get("/api/health")
def health_check(): return {"status": "ok"}

# ── Forwarding ─────────────────────────────────────────────────────────────────
class ForwardRule(BaseModel):
    source_port: int
    target_port: int

@app.get("/api/forward")
def get_forward_rules(): return forwarder.get_active_rules()

@app.post("/api/forward")
def start_forwarding(rule: ForwardRule):
    result = forwarder.start_forward(rule.source_port, rule.target_port)
    if not result["success"]: raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.delete("/api/forward/{source_port}")
def stop_forwarding(source_port: int):
    result = forwarder.stop_forward(source_port)
    if not result["success"]: raise HTTPException(status_code=400, detail=result["message"])
    return result

# ── Hardware ────────────────────────────────────────────────────────────────────
@app.get("/api/hardware")
def get_hardware_info():
    result = hardware.get_hardware_diagnostics()
    if not result["success"]: raise HTTPException(status_code=500, detail=result["message"])
    return result

# ── Processes ───────────────────────────────────────────────────────────────────
@app.get("/api/processes")
def get_system_processes():
    result = core.get_all_processes()
    if not result["success"]: raise HTTPException(status_code=500, detail=result["message"])
    return result

# ── Performance ─────────────────────────────────────────────────────────────────
@app.get("/api/performance/live")
def get_live_performance():
    result = performance.get_live_performance()
    if not result["success"]: raise HTTPException(status_code=500, detail="Performance fetch failed")
    return result

@app.get("/api/performance/history")
def get_performance_history(hours: int = 1):
    return {"success": True, "snapshots": database.get_history(hours=hours)}

# ── WebSocket real-time feed ────────────────────────────────────────────────────
@app.websocket("/ws/performance")
async def ws_performance(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = performance.get_live_performance()
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass

# ── Workspaces ──────────────────────────────────────────────────────────────────
class WorkspaceRequest(BaseModel):
    name: str
    commands: List[str]
    cwd: Optional[str] = None

@app.get("/api/workspace")
def get_workspaces(): return orchestrator.runner.get_workspaces()

@app.post("/api/workspace")
def start_workspace(req: WorkspaceRequest):
    result = orchestrator.runner.start_workspace(req.name, req.commands, req.cwd)
    if not result["success"]: raise HTTPException(status_code=500, detail=result["message"])
    return result

@app.delete("/api/workspace/{ws_id}")
def stop_workspace(ws_id: str):
    result = orchestrator.runner.stop_workspace(ws_id)
    if not result["success"]: raise HTTPException(status_code=404, detail=result["message"])
    return result

@app.get("/api/workspace/{ws_id}/logs")
def get_workspace_logs(ws_id: str):
    result = orchestrator.runner.get_logs(ws_id)
    if not result["success"]: raise HTTPException(status_code=404, detail=result["message"])
    return result

# ── Network Security ─────────────────────────────────────────────────────────────
@app.get("/api/network/security")
def get_network_security(): return network_security.get_network_security()

# ── Project Scanner ─────────────────────────────────────────────────────────────
@app.get("/api/projects/scan")
def scan_projects(path: str = os.path.expanduser("~/Desktop/Projects")):
    return project_scanner.scan_projects(path)

# ── Startup Manager ─────────────────────────────────────────────────────────────
@app.get("/api/startup")
def get_startup(): return startup_manager.get_startup_programs()

class StartupDeleteRequest(BaseModel):
    name: str
    hive: str
    key_path: str

@app.delete("/api/startup")
def delete_startup(req: StartupDeleteRequest):
    result = startup_manager.disable_startup(req.name, req.hive, req.key_path)
    if not result["success"]: raise HTTPException(status_code=400, detail=result["message"])
    return result

# ── Alerts ───────────────────────────────────────────────────────────────────────
@app.get("/api/alerts")
def get_alerts(): return {"success": True, "alerts": database.get_recent_alerts(limit=50)}

@app.get("/api/alerts/thresholds")
def get_thresholds(): return {"success": True, "thresholds": alerts.get_thresholds()}

class ThresholdUpdate(BaseModel):
    cpu_percent: Optional[float] = None
    mem_percent: Optional[float] = None

@app.post("/api/alerts/thresholds")
def update_thresholds(req: ThresholdUpdate):
    new = {k: v for k, v in req.dict().items() if v is not None}
    return {"success": True, "thresholds": alerts.update_thresholds(new)}

# ── Diagnostic Report ─────────────────────────────────────────────────────────────
@app.get("/api/report", response_class=HTMLResponse)
def get_report():
    procs = core.get_all_processes().get("processes", [])
    html = report_generator.generate_html_report(processes=procs)
    return HTMLResponse(content=html)

# ── Static Frontend ────────────────────────────────────────────────────────────────
def get_resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

static_path  = get_resource_path("static")
assets_path  = os.path.join(static_path, "assets")
index_path   = os.path.join(static_path, "index.html")

app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

@app.get("/{full_path:path}")
def serve_react_app(full_path: str):
    return FileResponse(index_path)
