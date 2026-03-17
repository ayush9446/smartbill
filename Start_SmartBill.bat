@echo off
cd /d "%~dp0"

:: Check if this is the first time running (no venv)
if not exist "venv\" (
    echo ===================================================
    echo   SmartBill: First-Time Setup
    echo   Installing dependencies... please wait...
    echo ===================================================
    echo.
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        msg "%USERNAME%" "Python is NOT installed on this PC. Please install it from www.python.org/downloads (ensure you check 'Add Python to PATH') before running SmartBill."
        exit /b
    )
    python -m venv venv
    if %errorlevel% neq 0 (
        echo Failed to create virtual environment.
        pause
        exit /b
    )
    call venv\Scripts\activate.bat
    if exist "requirements.txt" (
        pip install -r requirements.txt
    )
    cls
    echo Setup complete! Starting SmartBill...
    timeout /t 2 >nul
)

:: If the script is restarted with the hidden flag, go to the actual execution
if "%~1"=="-hidden" goto :HiddenRun

:: Restart the script completely hidden using a temporary VBScript
set "VBS_FILE=%TEMP%\RunHidden_%RANDOM%.vbs"
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_FILE%"
echo WshShell.Run chr(34) ^& "%~dpnx0" ^& chr(34) ^& " -hidden", 0, False >> "%VBS_FILE%"
cscript //nologo "%VBS_FILE%"
del "%VBS_FILE%"
exit /b

:HiddenRun
cd /d "%~dp0"
call venv\Scripts\activate.bat
:: Start browser after server has a chance to start
start /b cmd /c "timeout /t 3 >nul & start http://localhost:8000"
:: Use `python -m uvicorn` to ensure it uses the venv's python
python -m uvicorn main:app --host 0.0.0.0 --port 8000
