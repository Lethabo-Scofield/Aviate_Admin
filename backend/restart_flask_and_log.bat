@echo off
REM Stop all python processes (be careful: this kills all python.exe)
taskkill /IM python.exe /F
REM Wait a moment
timeout /T 2
REM Start Flask server and log output
cd /d %~dp0
python app.py
pause