# ⚡ Quick Deploy Checklist

## ✅ Antes de Deployar

- [ ] Código testado localmente
- [ ] `git push origin main` executado
- [ ] Contas criadas: [Render](https://render.com) + [Vercel](https://vercel.com)

## 🚀 Deploy em 5 minutos

### 1. Deploy Backend (Render) — 3min

```
Render.com Dashboard
  → New Web Service
  → Conectar GitHub repo
  
Name: opportunity-radar-api
Root Directory: backend
Build: pip install -r requirements.txt && playwright install chromium
Start: gunicorn -w 1 -k uvicorn.workers.UvicornWorker main:app

Env Variables:
  CORS_ORIGINS = http://localhost:5173
  ENVIRONMENT = production
  
✅ Deploy criado!
Copiar URL: https://opportunity-radar-api.onrender.com
```

### 2. Deploy Frontend (Vercel) — 2min

```
Vercel.com Dashboard
  → New Project
  → Conectar GitHub repo
  
Framework: Vite
Root Directory: frontend
Build: npm run build
Output: dist

Env Variable:
  VITE_API_URL = https://opportunity-radar-api.onrender.com

✅ Deploy criado!
Copiar URL: https://opportunity-radar-[seu-id].vercel.app
```

### 3. Atualizar CORS Backend

```
Render Dashboard
  → opportunity-radar-api
  → Settings / Environment
  
Editar CORS_ORIGINS:
  https://opportunity-radar-[seu-id].vercel.app,http://localhost:5173

✅ Salvar (vai redeploy automaticamente)
```

## 🧪 Teste

Acesse sua URL no Vercel:
- Busque uma cidade + categoria
- Verifique se o mapa carrega
- Teste filtros e analytics

**Pronto!** 🎉

---

## 📖 Instruções Completas

Veja `DEPLOYMENT.md` para guia detalhado com troubleshooting.

---

## 🔗 Links Úteis

- Backend Logs: https://dashboard.render.com
- Frontend Logs: https://vercel.com/dashboard
- Status API: https://opportunity-radar-api.onrender.com
