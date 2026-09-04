#!/usr/bin/env bash
# ==============================================================================
# Agent Skill Trending - 1-Click Production Deployment Script
# Supports: Docker Compose (All-in-one) or Local Process Deployment
# ==============================================================================

set -e

echo "======================================================================"
echo "🚀 Agent Skill Trending - Production Deployment Manager"
echo "======================================================================"

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker compose &> /dev/null; then
    echo "🐳 Docker & Docker Compose detected."
    echo "Starting full stack (PostgreSQL + FastAPI Backend + Nginx Frontend)..."
    
    # Create .env if not exists
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            echo "📄 Created .env from .env.example"
        fi
    fi

    # Build and start containers in background
    docker compose up -d --build

    echo ""
    echo "======================================================================"
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "======================================================================"
    echo "🌐 Frontend UI:     http://localhost:3099"
    echo "🔌 Backend API:     http://localhost:8899"
    echo "📚 Swagger API Doc: http://localhost:8899/docs"
    echo "🗄️ PostgreSQL DB:   localhost:5433 (user: agent_admin)"
    echo "🧭 Adminer DB Web:  http://localhost:8088"
    echo "======================================================================"
    echo "Useful commands:"
    echo "  - View logs:    docker compose logs -f"
    echo "  - Stop stack:   docker compose down"
    echo "  - Restart:      docker compose restart"
    echo "======================================================================"
else
    echo "⚠️ Docker not found or not running. Falling back to local Node/Python deploy..."
    
    # Backend setup
    echo "📦 Preparing Backend..."
    cd backend
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    .venv/bin/pip install --upgrade pip
    .venv/bin/pip install -r requirements.txt
    
    echo "🚀 Starting Backend on http://localhost:8899..."
    nohup .venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8899 > backend.log 2>&1 &
    cd ..

    # Frontend setup
    echo "📦 Preparing Frontend..."
    cd frontend
    npm install
    npm run build
    
    echo "🚀 Starting Frontend preview on http://localhost:3000..."
    nohup npx vite preview --port 3000 --host 0.0.0.0 > frontend.log 2>&1 &
    cd ..

    echo ""
    echo "======================================================================"
    echo "✅ LOCAL DEPLOYMENT SUCCESSFUL!"
    echo "======================================================================"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔌 Backend:  http://localhost:8899"
    echo "📄 Logs:     backend/backend.log, frontend/frontend.log"
    echo "======================================================================"
fi
