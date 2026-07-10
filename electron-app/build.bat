@echo off
cd /d "%~dp0"
echo.
echo  ══════════════════════════════════════════════════════════
echo   TIMER PRO — Building portable executable...
echo  ══════════════════════════════════════════════════════════
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo  [INFO] Installing dependencies...
    call npm install
    echo.
)

:: Build portable exe
call npm run build

echo.
echo  ══════════════════════════════════════════════════════════
echo   Build complete! Check the 'dist' folder.
echo  ══════════════════════════════════════════════════════════
echo.
pause
