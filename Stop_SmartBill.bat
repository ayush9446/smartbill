@echo off
TITLE Stop SmartBill Server

echo ===================================================
echo   Stopping SmartBill Background Server...
echo ===================================================
echo.

:: Call powershell to find and safely kill only the python process running uvicorn
powershell -Command "Get-WmiObject Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'python' -and $_.CommandLine -match 'uvicorn' } | Stop-Process -Force -ErrorAction SilentlyContinue"

echo SmartBill server stopped successfully.
timeout /t 3 >nul
