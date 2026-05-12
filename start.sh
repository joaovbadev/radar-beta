#!/usr/bin/env bash
set -e

echo ""
echo " ========================================="
echo "  Opportunity Radar — Iniciando..."
echo " ========================================="
echo ""

# Backend
echo "[1/2] Iniciando backend..."
(
  cd backend
  [ ! -d venv ] && python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt -q
  playwright install chromium --quiet
  python main.py
) &

sleep 4

# Frontend
echo "[2/2] Iniciando frontend..."
(
  cd frontend
  npm install --silent
  npm run dev
) &

echo ""
echo " Backend  → http://localhost:8000"
echo " Frontend → http://localhost:5173"
echo " Docs     → http://localhost:8000/docs"
echo ""

wait
