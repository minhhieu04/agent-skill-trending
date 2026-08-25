#!/bin/bash
set -e

echo "🚀 Khởi động Agent Skill Trending Platform..."

# Check Python venv
if [ ! -d "backend/.venv" ]; then
    echo "📦 Đang tạo virtual environment cho backend..."
    python3.12 -m venv backend/.venv || python3 -m venv backend/.venv
    backend/.venv/bin/pip install -r backend/requirements.txt
fi

# Check frontend node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Đang cài đặt frontend dependencies..."
    npm --prefix frontend install
fi

echo "🟢 Khởi chạy Backend FastAPI tại http://localhost:8000..."
backend/.venv/bin/uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "🟢 Khởi chạy Frontend Vite tại http://localhost:3000..."
npm --prefix frontend run dev &
FRONTEND_PID=$!

trap "echo '🛑 Đang dừng services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM EXIT

wait
