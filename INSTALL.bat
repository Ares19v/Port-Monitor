@echo off
setlocal EnableDelayedExpansion
title Port-Monitor Installer

echo.
echo  ============================================================
echo   Port-Monitor - Installation
echo  ============================================================
echo.

:: ── Check Python ──────────────────────────────────────────────────────────────
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Python not found. Install Python 3.11+ from https://python.org
    pause & exit /b 1
)
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo  [OK] Python %PYVER% detected.

:: ── Check Node.js ────────────────────────────────────────────────────────────
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Node.js not found. Install Node.js 20+ from https://nodejs.org
    pause & exit /b 1
)
for /f %%v in ('node --version') do set NODEVER=%%v
echo  [OK] Node.js %NODEVER% detected.

echo.
echo  [1/3] Setting up Python virtual environment...
if not exist "backend\venv" (
    python -m venv backend\venv
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR] Failed to create virtual environment.
        pause & exit /b 1
    )
)
echo  [OK] Virtual environment ready.

echo.
echo  [2/3] Installing Python dependencies...
backend\venv\Scripts\python.exe -m pip install --quiet --upgrade pip
backend\venv\Scripts\pip.exe install --quiet -r backend\requirements.txt
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Failed to install Python dependencies.
    pause & exit /b 1
)
echo  [OK] Python dependencies installed.

echo.
echo  [3/3] Installing Node.js dependencies...
cd frontend
npm install --silent
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Failed to install Node.js dependencies.
    cd ..
    pause & exit /b 1
)
cd ..
echo  [OK] Node.js dependencies installed.

echo.
echo  ============================================================
echo   Installation complete!
echo   Run Run_Project.bat to launch Port-Monitor.
echo  ============================================================
echo.
pause
