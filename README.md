<div align="center">

<h1>⬡ Port-Monitor</h1>

<p><strong>A Windows system orchestration suite — real-time port monitoring, network security analysis, hardware telemetry, and developer workspace management.</strong></p>

[![CI](https://github.com/Ares19v/Port-Monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/Ares19v/Port-Monitor/actions/workflows/ci.yml)

[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows)](https://github.com/Ares19v/Port-Monitor)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)

</div>

---

## Overview

**Port-Monitor** is a standalone Windows desktop application that gives you complete visibility and control over your system. Built on a FastAPI backend with a React/Tailwind UI rendered inside a native webview window, it monitors everything from live CPU/RAM/GPU telemetry to active network connections and developer project workspaces — all in one place.

## Features

| Module | Description |
|---|---|
| 📊 **Performance Dashboard** | Real-time CPU, RAM, Disk I/O, and Network charts with SQLite history |
| 🔌 **Active Ports** | View and kill processes bound to any port |
| 🔒 **Network Security Map** | GeoIP lookup, VPN/proxy detection, and risk scoring for all active connections |
| 🖥️ **Hardware Diagnostics** | CPU, GPU (NVIDIA), and memory hardware details via WMI |
| 🧩 **Process Manager** | Full system process list with memory and CPU usage |
| 🔁 **Port Forwarding** | Create and manage TCP port forwarding rules at runtime |
| 🚀 **Workspace Orchestrator** | Launch and manage multi-command developer workspaces |
| 📁 **Project Scanner** | Scan a directory tree and one-click launch any project |
| ⚡ **Startup Manager** | View and remove Windows startup registry entries |
| 🔔 **Alerts & Reports** | Configurable CPU/RAM threshold alerts with Windows toast notifications |

## Architecture

```
Port-Monitor/
├── backend/            # FastAPI (Python) — system APIs
│   ├── main.py         # Entry point (uvicorn + pywebview)
│   ├── server.py       # All API routes
│   ├── core.py         # Port & process management
│   ├── performance.py  # Live telemetry + DB persistence
│   ├── network_security.py  # GeoIP + connection risk analysis
│   ├── hardware.py     # WMI hardware diagnostics
│   ├── orchestrator.py # Workspace runner
│   ├── alerts.py       # Threshold alerts + toast notifications
│   └── database.py     # SQLite history store
└── frontend/           # React + Tailwind (Vite)
    └── src/
        └── components/ # 10 UI panel components
```

## Getting Started

### Prerequisites
- Windows 10/11
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 20+](https://nodejs.org/)

### Option 1 — Install & Run Scripts (Recommended)

```bat
# 1. Install all dependencies
INSTALL.bat

# 2. Run the application (packaged desktop app)
Run_Project.bat
```

### Option 2 — Docker (Web UI only)

```bash
docker-compose up --build
```
> Access the UI at `http://localhost:3000`. Note: Windows-specific features (WMI, registry, toast alerts) require the native desktop app.

### Option 3 — Manual Dev Mode

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn server:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Building the Executable

```bat
cd backend
venv\Scripts\python.exe -m PyInstaller --noconfirm --onedir --windowed ^
  --add-data "static;static" ^
  --collect-all requests --collect-all winotify ^
  main.py
```
Output: `backend/dist/main/main.exe`

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | [pywebview](https://pywebview.app/) |
| Backend | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) |
| System APIs | [psutil](https://pypi.org/project/psutil/), [WMI](https://pypi.org/project/WMI/), [pywin32](https://pypi.org/project/pywin32/) |
| Database | SQLite (built-in) |
| Frontend | [React 19](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Build Tool | [Vite 8](https://vitejs.dev/) |
| Packaging | [PyInstaller](https://pyinstaller.org/) |

---
<p align="center">
  Made by Devansh Tyagi @ 2026
</p>