@echo off
setlocal EnableDelayedExpansion
title Port-Monitor

echo.
echo  ============================================================
echo   Port-Monitor - Launching...
echo  ============================================================
echo.

:: ── Verify installation ───────────────────────────────────────────────────────
:: Virtual environment check bypassed (using system Python if venv absent)

:: ── Kill any process already using port 8000 ──────────────────────────────────
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000 "') do (
    set PID=%%a
    if not "!PID!"=="0" (
        taskkill /F /PID !PID! >nul 2>&1
    )
)

:: ── Mode: Packaged EXE ────────────────────────────────────────────────────────
if exist "backend\dist\main\main.exe" (
    echo  [INFO] Starting packaged desktop application...
    echo  [INFO] App will open in a moment.
    start "" "backend\dist\main\main.exe"
    goto :done
)

:: ── Mode: Dev (no packaged exe found) ─────────────────────────────────────────
echo  [INFO] No packaged build found. Starting in development mode...
echo  [INFO] Building frontend...

cd frontend
call npm run build >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [WARN] Frontend build failed. Continuing with existing static files.
)
cd ..

:: Copy built frontend into backend static directory
if exist "frontend\dist" (
    if not exist "backend\static" mkdir "backend\static"
    xcopy /s /y /q "frontend\dist\*" "backend\static\" >nul 2>&1
    echo  [OK] Frontend assets copied to backend\static\
)

echo  [INFO] Starting backend server...
echo  [INFO] Opening http://127.0.0.1:8000 in browser in 3 seconds...
start "" "backend\python" -m uvicorn server:app --host 127.0.0.1 --port 8000 --app-dir backend
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:8000"

:done
echo.
echo  ============================================================
echo   Port-Monitor is running.
echo   Close this window to keep it running in the background.
echo  ============================================================
echo.
