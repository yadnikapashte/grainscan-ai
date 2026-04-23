#!/usr/bin/env bash
# GrainScan AI — One-command startup script
set -e

echo "🌾 GrainScan AI — Startup"
echo "========================="

# Backend
echo ""
echo "▶ Starting Backend..."
cd backend
if [ ! -d "venv" ]; then
  echo "  Creating Python virtualenv..."
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "  ✓ Backend running at http://localhost:8000 (PID: $BACKEND_PID)"

cd ..

# Frontend
echo ""
echo "▶ Starting Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
  echo "  Installing npm packages..."
  npm install
fi
npm run dev &
FRONTEND_PID=$!
echo "  ✓ Frontend running at http://localhost:5173 (PID: $FRONTEND_PID)"

echo ""
echo "========================="
echo "🚀 GrainScan AI is running!"
echo "   App:  http://localhost:5173"
echo "   API:  http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services."
echo "========================="

# Wait and cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
