@echo off
echo.
echo  =========================================
echo   Opportunity Radar — Iniciando...
echo  =========================================
echo.

:: Backend
echo [1/2] Iniciando backend...
start "Opportunity Radar - Backend" cmd /k "cd backend && (if not exist venv (python -m venv venv)) && venv\Scripts\activate && pip install -r requirements.txt -q && playwright install chromium --quiet && python main.py"

:: Wait a moment for backend to start
timeout /t 4 /nobreak >nul

:: Frontend
echo [2/2] Iniciando frontend...
start "Opportunity Radar - Frontend" cmd /k "cd frontend && npm install --silent && npm run dev"

echo.
echo  Backend  → http://localhost:8000
echo  Frontend → http://localhost:5173
echo  Docs     → http://localhost:8000/docs
echo.
timeout /t 6 /nobreak >nul
start "" "http://localhost:5173"
