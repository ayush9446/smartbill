
@echo off
echo ===================================================
echo   SmartBill: Building Secure EXE...
echo ===================================================

:: Ensure PyInstaller is installed (Most basic command)
venv\Scripts\python.exe -m pip install pyinstaller

:: Build the EXE (Single line for maximum compatibility)
echo [1/2] Building the EXE (this will take 1-2 minutes)...
venv\Scripts\python.exe -m PyInstaller --noconfirm --onefile --clean --windowed --name "SmartBill" --add-data "app;app" --hidden-import "h11" --hidden-import "uvicorn.protocols" --hidden-import "uvicorn.protocols.http" --hidden-import "uvicorn.protocols.http.h11_impl" --hidden-import "uvicorn.lifespan" --hidden-import "uvicorn.lifespan.on" "main.py"

:: Check if build worked
if not exist "dist\SmartBill.exe" (
    echo [FAILURE] Build failed. Please check the logs.
    pause
    exit /b 1
)

:: Prepare Final Package
echo [2/2] Creating Secure Distribution Folder: SmartBill_Final...
if exist "SmartBill_Final" rd /s /q "SmartBill_Final"
mkdir "SmartBill_Final"
copy "dist\SmartBill.exe" "SmartBill_Final\"
if exist "smartbill.db" copy "smartbill.db" "SmartBill_Final\"

:: Create a CLEAN settings.json (No password)
echo [INFO] Generating clean settings.json...
if exist "settings.json" (
    powershell -Command " = Get-Content 'settings.json' | ConvertFrom-Json; if (.PSObject.Properties.Name -contains 'SETTINGS_PASSWORD') { .PSObject.Properties.Remove('SETTINGS_PASSWORD') };  | ConvertTo-Json | Set-Content 'SmartBill_Final\settings.json'"
) else (
    echo {"SHOP_NAME": "AKS SUPERMARKET"} > "SmartBill_Final\settings.json"
)

:: EXTRA CLEANUP (Delete temporary work folders)
echo [CLEANUP] Removing redundant files and folders...
rd /s /q "build"
rd /s /q "dist"
del /f /q "*.spec"

echo ===================================================
echo   SUCCESS! 
echo   Your folder is ready in: SmartBill_Final
echo ===================================================
pause

