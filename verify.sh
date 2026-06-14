#!/bin/bash
# Verify ZWARMIS Backend Installation
# Run this script to check that all files are in place

echo "======================================================"
echo "  ZWARMIS Backend - Installation Verification"
echo "======================================================"
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION found"
else
    echo "❌ Node.js not found - Please install Node.js"
    exit 1
fi

echo ""
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm $NPM_VERSION found"
else
    echo "❌ npm not found"
    exit 1
fi

echo ""
echo "======================================================"
echo "  Backend Files"
echo "======================================================"

# Check core files
FILES=(
    "server.js"
    "config.js"
    "storage.js"
    "emailService.js"
    "package.json"
    "dams-data.json"
    ".env.example"
    "README.md"
    "routes/auth.js"
    "routes/admin.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        SIZE=$(du -h "$file" | cut -f1)
        echo "✅ $file ($SIZE)"
    else
        echo "❌ $file - NOT FOUND"
    fi
done

echo ""
echo "======================================================"
echo "  Dependencies"
echo "======================================================"

if [ -d "node_modules" ]; then
    PKG_COUNT=$(ls -1 node_modules | wc -l)
    echo "✅ node_modules exists ($PKG_COUNT packages installed)"
else
    echo "⚠️  node_modules not found - Run: npm install"
fi

echo ""
echo "======================================================"
echo "  Quick Start"
echo "======================================================"
echo ""
echo "To start the backend server, run:"
echo "  npm start"
echo ""
echo "To start with auto-reload (development):"
echo "  npm run dev"
echo ""
echo "Server will run on: http://localhost:3001"
echo ""
echo "======================================================"
