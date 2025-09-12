@echo off
echo University of Venda Master File Import Script
echo =============================================

REM Change to the scripts directory
cd /d "c:\Users\tjmar\OneDrive\Documents\GitHub\Smart-Kollect\scripts"

REM Check if node is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js v18 or higher and try again
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo Error: package.json not found
    echo Please ensure you are in the correct directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Run the import script
echo Starting import process...
node import-univen-master-file.js

echo.
echo Import process completed.
pause