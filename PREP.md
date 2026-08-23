# 🔌 Port-Monitor Study Guide (From-Scratch)

Welcome to the beginner's learning guide for **Port-Monitor**, a powerful Windows system diagnostics and workspace launcher app. In this guide, you will learn how native desktop wrappers, hardware telemetry, network security auditing, and compiled desktop executable builds work.

---

## 🗺️ Architectural Map

Port-Monitor is a standalone Windows desktop app that bridges low-level operating system APIs to a responsive React interface.

```
┌────────────────────────────────────────────────────────┐
│               PyWebView Desktop Shell                  │
│  - Embeds the React + Tailwind (Vite 8) Web UI        │
│  - Renders dashboard components, telemetry, & charts   │
└──────────────────────────┬─────────────────────────────┘
                           │ Direct Web API Queries
┌──────────────────────────▼─────────────────────────────┐
│                 FastAPI Python Backend                 │
├────────────────────────────────────────────────────────┤
│ 1. main.py (Entry point coordinates PyWebView runtime) │
│ 2. server.py (FastAPI server exposes local endpoints)  │
│ 3. core.py (inspects ports, maps process bindings)     │
│ 4. performance.py (collects telemetry & saves SQLite)  │
│ 5. hardware.py (Queries WMI system sensor structures)  │
│ 6. orchestrator.py (Executes subprocess project tasks) │
└────────────────────────────────────────────────────────┘
```

---

## ⚙️ Core Technical Concepts

Let's explore the key components that give Port-Monitor its diagnostic capabilities:

### 1. The Desktop Webview Wrapper (`pywebview`)
Rather than opening the interface inside Chrome or Edge, Port-Monitor uses **PyWebView**.
*   **What it does**: A lightweight library that builds a native desktop window and embeds a browser engine inside it.
*   **Why it's great**: You get the design freedom of React and Tailwind CSS, coupled with the system access of Python, compiled into a standalone desktop application!

### 2. Deep Windows API Bridges
To inspect active processes, performance speeds, and hardware parts, Python maps into local OS APIs:
*   **Active Port Terminations**: Using the `psutil` library, Python scans active network connections. If you click **Kill Process** in the UI, Python matches the port to a Process ID (PID) and runs the command `os.kill(pid, signal.SIGTERM)`.
*   **WMI Telemetry**: The **Windows Management Instrumentation** (WMI) framework is a system directory built into Windows. By querying WMI, Python reads diagnostic details directly from your physical CPU and NVIDIA GPUs.
*   **Toast Notifications**: Using `winotify`, the system pushes native Windows 10/11 slide-in banners to your desktop when CPU or memory temperatures exceed threshold limits.

### 3. Packaging into `.exe` Executables (PyInstaller)
To make this application a single executable that users can open with a click:
*   We use **PyInstaller**.
*   PyInstaller parses the Python backend scripts, bundles a lightweight Python environment, gathers the static React UI folders, and packages them into a single executable located at `backend/dist/main/main.exe`.

---

## 🛠️ Step-by-Step Local Deployment

### 1. Windows One-Click Execution (Recommended)
*   **Install**: Run `INSTALL.bat`. This automatically builds the React frontend static directory and configures the Python backend venv.
*   **Launch**: Run `Run_Project.bat`. This launches the compiled desktop window instantly.
*   **Uninstall**: Run `UNINSTALL.bat` to clear modules and environment configurations.

### 2. Manual Dev Launch
If you want to run it with hot-reloading for code edits:

**Backend Launch:**
```bash
cd backend
python -m venv venv
# Activate the venv
.\venv\Scripts\activate
# Install requirements
pip install -r requirements.txt
# Run FastAPI server
python -m uvicorn server:app --reload --port 8000
```

**Frontend Launch:**
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` to explore the dashboard in development mode!
