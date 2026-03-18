
@echo off
echo ===================================================
echo   SmartBill: Stopping Background Process...
echo ===================================================

:: Forcefully kill the SmartBill.exe and its subprocesses
taskkill /F /IM SmartBill.exe /T 2>nul
taskkill /F /IM python.exe /T 2>nul

echo.
echo [DONE] SmartBill and Python processes have been stopped.
echo You can now ZIP, move, or rebuild your files safely.
echo.
pause

