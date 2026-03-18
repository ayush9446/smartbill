@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   SmartBill: Building Windowed Distribution...
echo ===================================================

:: Check if venv exists
if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment (venv) not found!
    echo Please make sure you have created the venv and installed requirements.
    pause
    exit /b 1
)

set PYTHON=venv\Scripts\python.exe

:: Check if PyInstaller is installed in the venv
%PYTHON% -m pip show pyinstaller >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [INFO] PyInstaller NOT found in venv.
    echo Installing PyInstaller now...
    %PYTHON% -m pip install pyinstaller
)

:: Clear previous build/dist folders
if exist "build" rd /s /q "build"
if exist "dist" rd /s /q "dist"

:: Build the EXE
echo.
echo [1/2] Building the EXE (Windowed mode - No Terminal)...
:: --onefile: bundle into a single EXE
:: --windowed: suppress the console window
:: --add-data: include app folder
:: --hidden-import: include optional uvicorn internals
%PYTHON% -m PyInstaller --noconfirm --onefile --clean --windowed ^
    --name "SmartBill" ^
    --add-data "app;app" ^
    --hidden-import "h11" --hidden-import "uvicorn.protocols" ^
    --hidden-import "uvicorn.protocols.http" --hidden-import "uvicorn.protocols.http.h11_impl" ^
    --hidden-import "uvicorn.lifespan" --hidden-import "uvicorn.lifespan.on" ^
    "main.py"

if %errorlevel% neq 0 (
    echo.
    echo [FAILURE] Build failed.
    pause
    exit /b %errorlevel%
)

:: Move the EXE to the distribution folder
set "DIST_FOLDER=SmartBill_DIST"
echo.
echo [2/2] Finalizing the distribution folder: %DIST_FOLDER%...

if exist "%DIST_FOLDER%" rd /s /q "%DIST_FOLDER%"
mkdir "%DIST_FOLDER%"

copy "dist\SmartBill.exe" "%DIST_FOLDER%\"

:: [CLEAN BUILD] Skip copying your local database (contains old history) or settings.
:: This ensures a clean experience for the final customer on a first-time install.
if exist "%DIST_FOLDER%\smartbill.db" del "%DIST_FOLDER%\smartbill.db"
if exist "%DIST_FOLDER%\settings.json" del "%DIST_FOLDER%\settings.json"


echo.
echo ===================================================
echo   SUCCESS! 
echo   Your folder is ready at: %DIST_FOLDER%
echo.
echo   NOTE: The terminal is now HIDDEN for a better 
echo   customer experience. When you run SmartBill.exe, 
echo   it will look like nothing is happening for 2-3 
echo   seconds, then the browser will open.
echo ===================================================
pause
