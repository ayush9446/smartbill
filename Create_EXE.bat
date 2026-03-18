@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   SmartBill: Building EXE for Customer...
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
echo [1/2] Building the EXE (this may take a few minutes)...
:: --onefile: bundle into a single EXE
:: --add-data: include app folder (static, templates, code)
:: --clean: clean build cache
:: --noconfirm: overwrite existing files without asking
:: --windowed: suppress console window (useful if building a GUI, but we want console logs for now to help debug)
venv\Scripts\python -m PyInstaller --noconfirm --onefile --clean ^
    --name "SmartBill" ^
    --add-data "app;app" ^
    "main.py"

if %errorlevel% neq 0 (
    echo.
    echo [FAILURE] Build failed. Please check errors above.
    pause
    exit /b %errorlevel%
)

:: Move the EXE to the distribution folder
set "DIST_FOLDER=SmartBill_Product"
echo.
echo [2/2] Finalizing the distribution package folder: %DIST_FOLDER%...

if exist "%DIST_FOLDER%" rd /s /q "%DIST_FOLDER%"
mkdir "%DIST_FOLDER%"

copy "dist\SmartBill.exe" "%DIST_FOLDER%\"

:: Copy persistent data files as starters (if they exist)
if exist "smartbill.db" (
    echo [INFO] Copying smartbill.db...
    copy "smartbill.db" "%DIST_FOLDER%\"
) else (
    echo [WARNING] smartbill.db not found. A fresh one will be created on first run.
)

if exist "settings.json" (
    echo [INFO] Copying settings.json...
    copy "settings.json" "%DIST_FOLDER%\"
) else (
    echo [WARNING] settings.json not found. A fresh one will be created on first run.
)

echo.
echo ===================================================
echo   SUCCESS! 
echo   Your distributable folder is: %DIST_FOLDER%
echo.
echo   Steps for the customer:
echo   1. Hand them the entire folder: "%DIST_FOLDER%"
echo   2. They just need to run "SmartBill.exe".
echo   3. Their browser will open automatically to the dashboard.
echo ===================================================
pause
