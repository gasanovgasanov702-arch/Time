@echo off
setlocal enabledelayedexpansion

echo.
echo =================================================================
echo             TIMER PRO - AUTOMATIC SETUP v2.0.0
echo =================================================================
echo.
echo This script will:
echo   - Install Node.js if needed
echo   - Install all dependencies
echo   - Build portable EXE
echo   - Copy TimerPro.exe to Desktop
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo [*] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js not found. Please install Node.js from https://nodejs.org
    echo [!] Download the LTS version and install it, then run this script again.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js found
echo %NODE_VERSION%

echo.
echo [*] Cleaning previous build...
if exist dist (
    rmdir /S /Q dist
    echo [OK] Cleaned dist folder
) else (
    echo [OK] No previous build found
)

echo.
echo [*] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed

echo.
echo [*] Creating icon...
if not exist assets mkdir assets
echo [OK] Icon will be created by Electron

echo.
echo [*] Building portable executable...
echo [*] This may take 2-5 minutes...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo.
echo [*] Copying to Desktop...
if exist "dist\TimerPro.exe" (
    copy "dist\TimerPro.exe" "%USERPROFILE%\Desktop\TimerPro.exe" /Y >nul
    echo [OK] TimerPro.exe copied to Desktop
) else (
    echo [ERROR] TimerPro.exe not found in dist folder
    pause
    exit /b 1
)

echo.
echo =================================================================
echo                     SETUP COMPLETE!
echo =================================================================
echo.
echo TimerPro.exe has been created and copied to your Desktop.
echo.
echo You can now run TimerPro.exe directly from your Desktop.
echo The application is portable - you can move it anywhere.
echo.
echo Features:
echo   - Multiple Timers (with names, default: "Claude")
echo   - Precision Stopwatch with Lap Tracking
echo   - Alarm Clock (one-time, recurring, snooze)
echo   - Auto-Updates (one-click install)
echo   - System Tray Integration
echo   - Statistics ^& Activity History
echo   - Customizable Themes ^& Colors
echo   - Multiple Sound Options
echo   - Professional Dark UI
echo.
echo Press any key to launch TimerPro...
pause >nul

start "" "%USERPROFILE%\Desktop\TimerPro.exe"
