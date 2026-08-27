<div align="center">

<h1>⬡ Port-Monitor</h1>


[![CI](https://github.com/Ares19v/Port-Monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/Ares19v/Port-Monitor/actions/workflows/ci.yml)

<p><strong>A modern Windows system orchestration suite & developer cockpit — real-time socket monitoring, project detection, network security mapping, and live hardware telemetry.</strong></p>

[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows)](https://github.com/Ares19v/Port-Monitor)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

</div>

---

## ⚡ Overview

**Port-Monitor** is an all-in-one Windows system control center designed specifically for developers and power users. Built on a **FastAPI** backend and a **React 19 / Tailwind CSS** interface, it provides instant socket diagnostics, project codebase detection, live hardware performance streaming, and network risk assessments.

---

## 🌟 Key Features

### 🔍 1. Global Command Palette (`Ctrl + K`)
- Press **`Ctrl + K`** (or `/`) from anywhere in the app to search ports, processes, and tools.
- Instant 1-click **Kill Port** or **End Task** directly from search results.
- **Smart Port Scanner**: Type any port number (e.g. `3000`) and instantly scan for the next available, conflict-free port (e.g. `3001`) with a copyable `PORT=3001` command.

### 📁 2. Codebase & Project Attribution
- Automatically inspects the working directory (`cwd`) and launch command (`cmdline`) of active servers.
- Labels ports with your top-level project name (e.g., `Delphi`, `Port-Monitor`, `Echo`) and provides a full directory path tooltip.

### 🔌 3. Active Ports & Dev Conflict Resolver
- Real-time table of all open TCP/UDP sockets.
- Dev service signatures: automatically categorizes `Vite`, `Next.js`, `FastAPI`, `Django`, `PostgreSQL`, `Redis`, `MongoDB`, etc.
- **Kill All Dev Ports**: Batch-kill orphaned processes occupying standard development ports (`3000`, `5173`, `8000`, `5000`, `8080`).
- Process hierarchy: inspect parent processes, child worker threads, and memory footprint.

### 📊 4. Real-Time Telemetry Dashboard
- **WebSocket Streaming**: Sub-second live updates without HTTP polling.
- **Per-Core CPU Load Meters**: Live visualizer across all logical CPU cores.
- **Top Resource Consumers**: Real-time list of top 5 CPU and top 5 RAM consumers with 1-click terminate actions.
- **GPU Telemetry**: NVIDIA GPU core utilization, VRAM allocation, and thermal monitoring.
- **SQLite History**: Historical performance data with 1h, 6h, and 24h lookup ranges.

### 🔒 5. Concurrent Network Security & Threat Map
- Non-blocking parallel GeoIP resolution using a multi-threaded pool and SQLite cache.
- Identifies external endpoints, VPNs, anonymous proxies, and flagged ports.

### 🖥️ 6. Ultra-Fast Hardware Diagnostics
- Optimized WMI queries delivering CPU, Display/GPU, physical Network link speeds, and power states in **< 0.3s**.

### 🚀 7. Workspace Orchestrator & Project Scanner
- Scan any directory tree for developer projects and launch multi-service stacks (backend + frontend + DB) with a single click.

---

## 🏗️ Architecture

```
Port-Monitor/
├── backend/                  # FastAPI (Python 3.11+)
│   ├── server.py             # REST API & WebSocket telemetry endpoints
│   ├── core.py               # Socket inspection, project detection & process control
│   ├── performance.py        # Live CPU/RAM/GPU/Disk telemetry & top consumers
│   ├── network_security.py   # Multi-threaded GeoIP & socket risk engine
│   ├── hardware.py           # Optimized WMI hardware queries
│   ├── database.py           # SQLite persistence store & GeoIP cache
│   ├── orchestrator.py       # Multi-process workspace runner
│   ├── project_scanner.py    # Local directory codebase discovery
│   └── alerts.py             # System thresholds & Windows toast alerts
└── frontend/                 # React 19 + Tailwind CSS (Vite 8)
    └── src/
        ├── App.jsx           # Sidebar layout & global routing
        └── components/       # 11 Modular UI panels + Command Palette
```

---

## 🚀 Getting Started

### Prerequisites
- Windows 10 / 11
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 20+](https://nodejs.org/)

### Quick Start

```bat
# 1. Install dependencies
INSTALL.bat

# 2. Run the application
Run_Project.bat
```

### Manual Development Mode

```bash
# Terminal 1: Backend Server
cd backend
python -m uvicorn server:app --reload --port 8000

# Terminal 2: Frontend Dev Server
cd frontend
npm install
npm run dev
```

* **Frontend UI:** `http://localhost:5173` or `http://127.0.0.1:8000`
* **Interactive API Documentation:** `http://127.0.0.1:8000/docs`

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) |
| **System APIs** | [psutil](https://pypi.org/project/psutil/), [WMI](https://pypi.org/project/WMI/), [pywin32](https://pypi.org/project/pywin32/) |
| **Database** | SQLite (built-in) |
| **Frontend Framework** | [React 19](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Build Tool** | [Vite 8](https://vitejs.dev/) |

---

© 2025 Devansh Tyagi (Ares19v). All Rights Reserved.
