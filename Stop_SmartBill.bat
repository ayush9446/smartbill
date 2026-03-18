@echo off
echo ===================================================
echo   SmartBill: Stopping Background Process...
echo ===================================================

:: Forcefully kill the SmartBill.exe and its subprocesses
taskkill /F /IM SmartBill.exe /T >nul 2>&1

:: Also kill python uvicorn if it was running
taskkill /F /IM python.exe /T >nul 2>&1

echo.
echo [DONE] SmartBill and Python processes have been stopped.
echo You can now ZIP, move, or rebuild your files safely.
echo.
pause
