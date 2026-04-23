@echo off
echo 🌾 GrainScan AI — Startup
echo =========================

echo.
echo Starting Backend...
cd backend
if not exist venv (
    echo Creating Python virtualenv...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt -q
start "GrainScan Backend" uvicorn main:app --reload --port 8000
echo Backend running at http://localhost:8000

cd ..\frontend
echo.
echo Starting Frontend...
if not exist node_modules (
    echo Installing npm packages...
    npm install
)
start "GrainScan Frontend" npm run dev
echo Frontend running at http://localhost:5173

echo.
echo =========================
echo GrainScan AI is running!
echo   App:  http://localhost:5173
echo   API:  http://localhost:8000
echo   Docs: http://localhost:8000/docs
echo =========================
pause
