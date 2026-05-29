# EVAL — Port-Monitor

> **Evaluation Date:** 2026-05-29  
> **Evaluator:** Automated Portfolio Review  
> **Maturity Level:** Production-Ready (Desktop App)

---

## 1. Project Purpose & Problem Statement

Developers and system administrators lack a consolidated desktop dashboard that bridges system performance, network active ports, and project workspace orchestration in a single interface. Managing open ports, checking VPN leaks, inspecting WMI system telemetry, and running multiple terminal workspace commands usually requires running several CLI tools.

**Port-Monitor** is a Windows desktop application that centralizes active port inspections, performance charts, GeoIP risk scoring, and multi-command project launchers. By wrapping a React/Tailwind frontend inside a native **PyWebView** container and hooking it to a local **FastAPI** backend with SQLite persistence, Port-Monitor delivers a powerful administrative GUI.

---

## 2. Technical Architecture & Stack

The application integrates low-level Windows APIs with a modern React frontend:

*   **Desktop Shell & Backend:**
    *   **PyWebView Shell:** Renders the static frontend bundle locally in a desktop container, bypassing standard browser security sandboxes.
    *   **FastAPI webserver:** Handles system resource queries and acts as the orchestrator endpoint.
    *   **PyInstaller Packaging:** Packages Python dependencies, the PyWebView shell, and frontend static files into a single `.exe` executable (`backend/dist/main/main.exe`).
*   **System and OS Bridges:**
    *   `core.py` (Ports): Hooks into `psutil` to view, analyze, and instantly kill processes bound to active TCP/UDP ports.
    *   `performance.py` (Telemetry): Tracks CPU, RAM, Disk, and Network speeds, saving historical logs to an on-disk **SQLite** database (`database.py`).
    *   `network_security.py` (Security): Runs GeoIP lookups and connection risk profiling for active IPs.
    *   `hardware.py` (WMI Diagnostics): Uses `pywin32` and `WMI` python bindings to read CPU, GPU, and physical RAM details directly from Windows.
    *   `orchestrator.py` & `project_scanner.py`: Scan directories to discover codebases and execute multi-command launcher scripts using subprocess pipelines.
    *   `alerts.py` & `startup_manager.py`: Pushes native Windows toast notifications using `winotify` and manages startup registries.

---

## 3. Strengths

*   **Excellent PyWebView Desktop Shell:** Bundling a modern React UI into a desktop shell via PyWebView and PyInstaller creates a highly responsive, standalone Windows application.
*   **Deep Windows OS Integrations:** Genuinely integrates Windows WMI diagnostics, startup registry manipulations, `winotify` alerts, and active process terminations.
*   **Workspace Orchestration:** Automatically scans folders, detects projects, and manages multi-command subprocess pipelines from a simple GUI.
*   **Zero-Dependency Setup Scripts:** The Batch script stack makes deployment painless:
    *   `INSTALL.bat` which handles node building and python venv compiling.
    *   `Run_Project.bat` which boots the compiled production static server seamlessly.

---

## 4. Limitations & Gaps

*   **Windows Platform Lock-in:** Native WMI bindings, `winotify` alerts, registry managers, and PyInstaller configs are highly platform-specific, making the desktop app incompatible with macOS and Linux.
*   **Security Concerns of Process Terminations:** The API endpoint `/api/ports/kill/{pid}` permits terminating any process, presenting security risks if another user or device accesses the FastAPI port on the network.
*   **External API Geolocation Dep:** The GeoIP security mapping relies on external REST calls (`ip-api.com`). If the machine runs offline, the map fails to display locations.

---

## 5. Code Quality Assessment

*   **Structure:** Extremely modular and organized. The backend segregates operations cleanly (`alerts.py`, `core.py`, `database.py`, `hardware.py`, `orchestrator.py`).
*   **Cleanliness:** Pinned requirements, custom spec files for PyInstaller (`main.spec`), and robust exception handling across WMI operations.

---

## 6. Maturity Breakdown

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Flawless active port control, GeoIP analytics, WMI diagnostics, workspace launchers. |
| Code Quality | 9/10 | Modular backend libraries, SQLite database integration, clear PyWebView orchestration. |
| Documentation | 8/10 | Solid installation guides, clean architectural schemas, and standard development commands. |
| Scalability | 7/10 | Restrained to single-node desktop installations. Platform specific (Windows). |
| Security | 7/10 | Local app execution; endpoints must be guarded against external LAN requests. |
| **Overall** | **8.0/10** | High-utility, production-ready system monitoring suite. Excellent desktop packaging. |

---

## 8. Suggested Next Steps

1.  **Add Authentication to API Endpoints:** Secure FastAPI routing with an app-generated, single-use authentication token, preventing unauthorized users on the local LAN from calling kill endpoints.
2.  **Incorporate Offline GeoIP Databases:** Bundle a lightweight local GeoIP database (like MaxMind GeoLite2) to resolve locations offline without external API dependencies.
3.  **Port Telemetry to Cross-Platform Libs:** Rewrite the startup manager, diagnostics, and notifications using cross-platform libraries (like `plyer` or platform checks) to support macOS and Linux builds.

---
<p align="center">Made by Devansh Tyagi @ 2026</p>
