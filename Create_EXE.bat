@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   SmartBill: Building Secure EXE...
echo ===================================================

:: 1. Check if venv exists
if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment (venv) not found!
    pause
    exit /b 1
)

:: 2. Ensure PyInstaller is installed in the venv
venv\Scripts\python -m pip show pyinstaller >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [INFO] Installing PyInstaller into your virtual environment...
    venv\Scripts\python -m pip install pyinstaller
)

:: 3. Clear previous folders
if exist "build" rd /s /q "build"
if exist "dist" rd /s /q "dist"
if exist "SmartBill_Final" rd /s /q "SmartBill_Final"

:: 4. Build the EXE (Single line to avoid ^ issues)
echo.
echo [1/2] Building the EXE (this may take 1-2 minutes)...
venv\Scripts\python -m PyInstaller --noconfirm --onefile --clean --windowed --name "SmartBill" --add-data "app;app" --hidden-import "h11" --hidden-import "uvicorn.protocols" --hidden-import "uvicorn.protocols.http" --hidden-import "uvicorn.protocols.http.h11_impl" --hidden-import "uvicorn.lifespan" --hidden-import "uvicorn.lifespan.on" "main.py"

if %errorlevel% neq 0 (
    echo.
    echo [FAILURE] Build failed. Please check if SmartBill.exe is still running!
    pause
    exit /b %errorlevel%
)

:: 5. Prepare Final Package
echo.
echo [2/2] Creating Secure Distribution Folder: SmartBill_Final...
mkdir "SmartBill_Final"
copy "dist\SmartBill.exe" "SmartBill_Final\"
if exist "smartbill.db" copy "smartbill.db" "SmartBill_Final\"

:: 6. Create a CLEAN settings.json (No password)
echo [INFO] Generating clean settings.json...
if exist "settings.json" (
    powershell -Command "$s = Get-Content 'settings.json' | ConvertFrom-Json; if ($s.PSObject.Properties.Name -contains 'SETTINGS_PASSWORD') { $s.PSObject.Properties.Remove('SETTINGS_PASSWORD') }; $s | ConvertTo-Json | Set-Content 'SmartBill_Final\settings.json'"
) else (
    echo {"SHOP_NAME": "AKS SUPERMARKET"} > "SmartBill_Final\settings.json"
)

echo.
echo ===================================================
echo   SUCCESS! 
echo   Your secure package is ready in: SmartBill_Final
echo   You can ZIP this folder and send it to customers.
echo ===================================================
pause
