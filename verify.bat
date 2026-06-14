@echo off
REM Verify ZWARMIS Backend Installation (Windows)
REM Run this script to check that all files are in place

cls
echo ======================================================
echo   ZWARMIS Backend - Installation Verification
echo ======================================================
echo.

REM Check Node.js
echo Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% == 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js !NODE_VERSION! found
) else (
    echo ❌ Node.js not found - Please install Node.js
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% == 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm !NPM_VERSION! found
) else (
    echo ❌ npm not found
    pause
    exit /b 1
)

echo.
echo ======================================================
echo   Backend Files
echo ======================================================
echo.

REM Check core files
setlocal enabledelayedexpansion
set "FILES[0]=server.js"
set "FILES[1]=config.js"
set "FILES[2]=storage.js"
set "FILES[3]=emailService.js"
set "FILES[4]=package.json"
set "FILES[5]=dams-data.json"
set "FILES[6]=.env.example"
set "FILES[7]=README.md"
set "FILES[8]=routes\auth.js"
set "FILES[9]=routes\admin.js"

for /L %%i in (0,1,9) do (
    if exist "!FILES[%%i]!" (
        echo ✅ !FILES[%%i]!
    ) else (
        echo ❌ !FILES[%%i]! - NOT FOUND
    )
)

echo.
echo ======================================================
echo   Dependencies
echo ======================================================
echo.

if exist "node_modules" (
    echo ✅ node_modules exists
) else (
    echo ⚠️  node_modules not found
    echo    Run: npm install
)

if exist "package-lock.json" (
    echo ✅ package-lock.json found
)

echo.
echo ======================================================
echo   Quick Start
echo ======================================================
echo.
echo To start the backend server, run:
echo   npm start
echo.
echo To start with auto-reload (development):
echo   npm run dev
echo.
echo Or double-click: start.bat
echo.
echo Server will run on: http://localhost:3001
echo.
echo ======================================================
echo.
pause
