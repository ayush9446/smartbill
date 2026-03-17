@echo off
set "DIST_FOLDER=SmartBill_Distribution"
echo ===================================================
echo   SmartBill: Creating Distribution Package...
echo ===================================================

:: Create a fresh distribution folder
if exist "%DIST_FOLDER%" rd /s /q "%DIST_FOLDER%"
mkdir "%DIST_FOLDER%"

:: Copy essential folders
xcopy /e /i "app" "%DIST_FOLDER%\app"

:: Copy essential scripts
copy "main.py" "%DIST_FOLDER%\"
copy "requirements.txt" "%DIST_FOLDER%\"
copy "Start_SmartBill.bat" "%DIST_FOLDER%\"
copy "Stop_SmartBill.bat" "%DIST_FOLDER%\"

:: Copy data files (only if they exist)
if exist "smartbill.db" copy "smartbill.db" "%DIST_FOLDER%\"
if exist "settings.json" copy "settings.json" "%DIST_FOLDER%\"

:: Remove any pycache files to keep it clean
for /d /r "%DIST_FOLDER%" %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"

echo.
echo ===================================================
echo   SUCCESS! 
echo   Your "clean" folder is ready: %DIST_FOLDER%
echo.
echo   1. Simply right-click the folder: %DIST_FOLDER%
echo   2. Select "Compress to ZIP file"
echo   3. Send that ZIP to your customer.
echo ===================================================
pause
