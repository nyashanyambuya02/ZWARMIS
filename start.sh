#!/bin/bash

# ZWARMIS Backend Startup Script
# This script starts the ZWARMIS backend server on macOS/Linux

echo ""
echo "======================================================"
echo "   ZWARMIS Backend Server Startup"
echo "======================================================"
echo ""

cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting server on http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
