@echo off
chcp 65001 > nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or higher is required. https://nodejs.org/
  pause
  exit /b 1
)
echo ==============================================
echo    MOYEO GAMES - http://localhost:3000
echo ==============================================
start "" "http://localhost:3000"
node server.js
pause
