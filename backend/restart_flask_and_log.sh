#!/bin/bash
# Kill all python processes (be careful: this kills all python)
pkill -f app.py
sleep 2
# Start Flask server and log output
python app.py