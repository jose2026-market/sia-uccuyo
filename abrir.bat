@echo off
cd /d "%~dp0"
echo SIA-UCCuyo — http://localhost:8765
start "" "http://localhost:8765"
python -m http.server 8765
