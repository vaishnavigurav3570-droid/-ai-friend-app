@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo         STARTING ANTIGRAVITY LOCALLY
echo ========================================================
echo.

:: 1. Find the computer's local IP address (IPv4)
for /f "tokens=14" %%a in ('ipconfig ^| findstr IPv4') do set LOCAL_IP=%%a

if "%LOCAL_IP%"=="" (
    echo [!] Could not automatically find your IP address. Using localhost...
    set LOCAL_IP=localhost
) else (
    echo [+] Found your local IP address: %LOCAL_IP%
)

:: 2. Automatically update the mobile app's .env file
echo [+] Updating mobile app configuration to connect to your PC...
echo EXPO_PUBLIC_API_URL=http://%LOCAL_IP%:3001/api > apps\mobile\.env
echo [+] Mobile app will connect to: http://%LOCAL_IP%:3001/api

echo.
echo ========================================================
echo  Step 0: Installing Dependencies (Please wait...)
echo ========================================================
call npm install

echo.
echo ========================================================
echo  Step 1: Starting the Backend Server (Port 3001)
echo ========================================================
:: Start the backend in a new command prompt window
start "Antigravity Backend API" cmd /k "npm run dev:backend"

echo.
echo ========================================================
echo  Step 2: Starting the Mobile App (Expo)
echo ========================================================
echo Make sure your Android phone is plugged in with a USB cable, 
echo or an Android Emulator is open!
echo.
echo Please wait while the app compiles...
echo.

:: Start the mobile app compilation in this window
cd apps\mobile
call npx expo run:android

pause
