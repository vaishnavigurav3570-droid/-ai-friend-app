@echo off
echo ========================================================
echo               STARTING AI FRIEND APP
echo ========================================================
echo.

:: 1. Start the Backend API (port 3001)
echo [+] Starting the Backend API (Port 3001)...
cd /d "C:\Users\Vedant\Desktop\antigravity"
start "AI Friend Backend" cmd /k "npm run dev:backend"

:: 2. Start the Vite Web Server (port 5173)
echo [+] Starting the Web App Dashboard...
cd /d "C:\Users\Vedant\Desktop\ai friend"
start "AI Friend Dashboard" cmd /k "npm run dev"

:: 3. Wait a moment and launch the browser
echo [+] Launching AI Friend in your browser...
timeout /t 3 >nul
start http://localhost:5173

echo.
echo ========================================================
echo  AI Friend is now running! 
echo  If the browser didn't open, visit: http://localhost:5173
echo ========================================================
echo.
pause
