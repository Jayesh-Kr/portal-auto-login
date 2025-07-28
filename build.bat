@echo off
REM Build script for SRM Auto Login Chrome Extension

echo.
echo ============================================
echo   SRM Auto Login Extension - Build Script
echo ============================================
echo.

REM Check if we're in the correct directory
if not exist "manifest.json" (
    echo ERROR: manifest.json not found!
    echo Please run this script from the extension directory.
    pause
    exit /b 1
)

echo [1/4] Checking required files...

REM Check for required files
set "missing_files="
if not exist "manifest.json" set "missing_files=%missing_files% manifest.json"
if not exist "content.js" set "missing_files=%missing_files% content.js"
if not exist "background.js" set "missing_files=%missing_files% background.js"
if not exist "options.html" set "missing_files=%missing_files% options.html"
if not exist "options.js" set "missing_files=%missing_files% options.js"
if not exist "crypto.js" set "missing_files=%missing_files% crypto.js"
if not exist "popup.html" set "missing_files=%missing_files% popup.html"
if not exist "popup.js" set "missing_files=%missing_files% popup.js"
if not exist "lib\tesseract.min.js" set "missing_files=%missing_files% lib\tesseract.min.js"

if not "%missing_files%"=="" (
    echo ERROR: Missing required files:%missing_files%
    pause
    exit /b 1
)

echo ✓ All required files present

echo.
echo [2/4] Validating manifest.json...
REM Basic validation of manifest.json
findstr /c:"manifest_version" manifest.json >nul
if errorlevel 1 (
    echo ERROR: Invalid manifest.json - missing manifest_version
    pause
    exit /b 1
)
echo ✓ Manifest validation passed

echo.
echo [3/4] Checking Tesseract.js library...
if exist "lib\tesseract.min.js" (
    echo ✓ Tesseract.js library found
) else (
    echo WARNING: Tesseract.js library not found
    echo Downloading Tesseract.js...
    if not exist "lib" mkdir lib
    powershell -Command "try { Invoke-WebRequest -Uri 'https://unpkg.com/tesseract.js@5.0.4/dist/tesseract.min.js' -OutFile 'lib\tesseract.min.js' } catch { Write-Host 'Download failed' }"
    if exist "lib\tesseract.min.js" (
        echo ✓ Tesseract.js downloaded successfully
    ) else (
        echo ERROR: Failed to download Tesseract.js
        echo Please download manually from: https://unpkg.com/tesseract.js@5.0.4/dist/tesseract.min.js
        pause
        exit /b 1
    )
)

echo.
echo [4/4] Creating distribution package...

REM Create a timestamp for the build
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set "build_date=%%c-%%a-%%b"
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "build_time=%%a-%%b"
set "build_timestamp=%build_date%_%build_time%"

REM Create build directory
if not exist "..\builds" mkdir "..\builds"
set "build_dir=..\builds\srm-auto-login-%build_timestamp%"
mkdir "%build_dir%"

REM Copy all necessary files
echo Copying files to build directory...
copy "manifest.json" "%build_dir%\" >nul
copy "content.js" "%build_dir%\" >nul
copy "background.js" "%build_dir%\" >nul
copy "options.html" "%build_dir%\" >nul
copy "options.js" "%build_dir%\" >nul
copy "crypto.js" "%build_dir%\" >nul
copy "popup.html" "%build_dir%\" >nul
copy "popup.js" "%build_dir%\" >nul
copy "README.md" "%build_dir%\" >nul

REM Copy lib directory
if not exist "%build_dir%\lib" mkdir "%build_dir%\lib"
copy "lib\tesseract.min.js" "%build_dir%\lib\" >nul

REM Copy icons directory
if not exist "%build_dir%\icons" mkdir "%build_dir%\icons"
copy "icons\icon.svg" "%build_dir%\icons\" >nul

echo.
echo ============================================
echo             BUILD COMPLETED!
echo ============================================
echo.
echo Build location: %build_dir%
echo.
echo To install the extension:
echo 1. Open Chrome and go to chrome://extensions/
echo 2. Enable "Developer mode" (top-right toggle)
echo 3. Click "Load unpacked"
echo 4. Select the folder: %build_dir%
echo.
echo ============================================
echo.

REM Offer to open the extensions page
set /p "open_extensions=Open Chrome extensions page? (y/n): "
if /i "%open_extensions%"=="y" (
    start chrome://extensions/
)

pause
