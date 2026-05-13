# 🚀 Guia de Deploy — Render + Vercel

Deploy gratuito da aplicação Opportunity Radar.

---

## 📋 Pré-requisitos

- [x] Conta GitHub com repo pushado
- [ ] Conta [Render.com](https://render.com) (sign up com GitHub)
- [ ] Conta [Vercel.com](https://vercel.com) (sign up com GitHub)

---

## 1️⃣ Backend — Render.com

### Passo 1: Prepare o repositório

```bash
# Certifique-se que está na raiz do projeto
cd c:\CODE\radar-beta

# Commit das mudanças
git add .
git commit -m "chore: add deployment configs"
git push origin main
```

### Passo 2: Crie o serviço no Render

1. Acesse [render.com/dashboard](https://render.com/dashboard)
2. Clique **New** → **Web Service**
3. Selecione seu repositório do GitHub
4. Preencha:
   - **Name**: `opportunity-radar-api`
   - **Region**: `São Paulo (São Paulo)` (mais rápido para Brasil)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```
     pip install -r requirements.txt && playwright install chromium
     ```
   - **Start Command**:
     ```
     gunicorn -w 1 -k uvicorn.workers.UvicornWorker main:app
     ```

5. **Environment** → Adicione variáveis:
   ```
   CORS_ORIGINS = http://localhost:5173
   ENVIRONMENT = production
   DEBUG = false
   ```
   *(Atualize `CORS_ORIGINS` depois que tiver a URL do Vercel)*

6. Clique **Create Web Service**
7. Aguarde ~3-5 minutos para build + deploy

**Sua URL será**: `https://opportunity-radar-api.onrender.com`

---

## 2️⃣ Frontend — Vercel

### Passo 1: Conecte no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Selecione seu repositório
3. Preencha:
   - **Framework**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Environment Variables** → Adicione:
   ```
   VITE_API_URL = https://opportunity-radar-api.onrender.com
   ```

5. Clique **Deploy**
6. Aguarde ~1-2 minutos

**Sua URL será**: `https://opportunity-radar-[random].vercel.app`

---

## 3️⃣ Atualize CORS no Backend

Após ter a URL do Vercel, volte ao Render:

1. Dashboard → `opportunity-radar-api` → **Environment**
2. Edite `CORS_ORIGINS`:
   ```
   https://opportunity-radar-[seu-random].vercel.app,http://localhost:5173
   ```
3. Clique **Save** (vai fazer redeploy automaticamente)

---

## ✅ Teste o Deploy

### Local (antes de deployar)

```bash
# Terminal 1: Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
python main.py
# Acesse: http://localhost:8000/docs

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
# Acesse: http://localhost:5173
```

### Em Produção

1. Acesse `https://opportunity-radar-[seu-random].vercel.app`
2. Busque uma cidade e categoria
3. Verifique no console (F12) se não há erros de CORS
4. Teste o mapa, filtros e analytics

---

## 🐛 Troubleshooting

| Erro | Solução |
|------|---------|
| **CORS error** | Atualize `CORS_ORIGINS` no Render e aguarde 1-2min para redeploy |
| **API 500** | Acesse `https://opportunity-radar-api.onrender.com/` no navegador → veja logs no Render dashboard |
| **Mapa não carrega** | Verifique `VITE_API_URL` em **Settings** → **Environment Variables** no Vercel |
| **"Playwright not found"** | Render precisa instalar Chromium — build pode levar 5-10min |

---

## 🔄 Atualizações Futuras

**Backend** — Commits em `main` na pasta `backend/` triggerem redeploy automático no Render.

**Frontend** — Commits em `main` na pasta `frontend/` triggerem redeploy automático no Vercel.

---

## 📊 Monitoramento

### Render
- Dashboard → Logs → veja erros em tempo real
- CPU/RAM aparecem ao lado da build

### Vercel
- Dashboard → Analytics → vê requests e performance
- **Deployments** → vê histórico de builds

---

## 🎯 Próximos Passos (Opcional)

- [ ] Compre domínio + configure DNS (ambos suportam domínios customizados)
- [ ] Ative auto-scaling no Render (pago)
- [ ] Implementar sistema de cache (Redis free)
- [ ] Usar S3 para persistir CSV (AWS free tier)

---

## 📞 Suporte

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **Vite**: https://vitejs.dev
