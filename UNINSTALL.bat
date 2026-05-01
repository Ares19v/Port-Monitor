@echo off
title Port-Monitor Uninstaller

echo.
echo  ============================================================
echo   Port-Monitor - Uninstall / Cleanup
echo  ============================================================
echo.

echo  Removing Python virtual environment...
if exist "backend\venv" (
    rmdir /s /q "backend\venv"
    echo  [OK] Removed backend\venv
) else (
    echo  [SKIP] backend\venv not found.
)

echo  Removing Node.js dependencies...
if exist "frontend\node_modules" (
    rmdir /s /q "frontend\node_modules"
    echo  [OK] Removed frontend\node_modules
) else (
    echo  [SKIP] frontend\node_modules not found.
)

echo  Removing build artifacts...
if exist "backend\build" (
    rmdir /s /q "backend\build"
    echo  [OK] Removed backend\build
)
if exist "backend\dist" (
    rmdir /s /q "backend\dist"
    echo  [OK] Removed backend\dist
)
if exist "frontend\dist" (
    rmdir /s /q "frontend\dist"
    echo  [OK] Removed frontend\dist
)
if exist "backend\portmonitor.db" (
    del /q "backend\portmonitor.db"
    echo  [OK] Removed portmonitor.db
)

echo.
echo  ============================================================
echo   Cleanup complete. Run INSTALL.bat to reinstall.
echo  ============================================================
echo.
pause
