@echo off
REM ZWARMIS Backend Startup Script
REM This script starts the ZWARMIS backend server on Windows

echo.
echo ======================================================
echo   ZWARMIS Backend Server Startup
echo ======================================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)

REM Start the server
echo Starting server on http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.

npm start
