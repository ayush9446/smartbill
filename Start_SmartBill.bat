@echo off

:: If the script is restarted with the hidden flag, go to the actual execution
if "%~1"=="-hidden" goto :HiddenRun

:: When double-clicked, immediately restart the script completely hidden using a temporary VBScript
set "VBS_FILE=%TEMP%\RunHidden_%RANDOM%.vbs"
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_FILE%"
echo WshShell.Run chr(34) ^& "%~dpnx0" ^& chr(34) ^& " -hidden", 0, False >> "%VBS_FILE%"
cscript //nologo "%VBS_FILE%"
del "%VBS_FILE%"
:: Close the initial terminal window immediately
exit /b

:HiddenRun
:: Ensure we run from the exact folder where this batch file is located
cd /d "%~dp0"

:: Check if Python is installed natively
python --version >nul 2>&1
if %errorlevel% neq 0 (
    :: Show a clean Windows popup if Python is missing instead of a terminal
    msg "%USERNAME%" "Python is not installed or not in your System PATH. Please install Python from python.org and ensure you check 'Add Python to PATH'."
    exit /b
)

:: Set up virtual environment and install dependencies if it's the first time running
if not exist "venv\" (
    python -m venv venv
    call venv\Scripts\activate.bat
    if exist "requirements.txt" (
        pip install -r requirements.txt
    )
) else (
    :: Activate existing virtual environment
    call venv\Scripts\activate.bat
)

:: Launch the browser in the background after waiting a brief period (3 seconds) for the server to spin up
start /b cmd /c "timeout /t 3 >nul & start http://localhost:8000"

:: Start the FastAPI server using Uvicorn (this stays open in the hidden background)
python -m uvicorn main:app --host 0.0.0.0 --port 8000
