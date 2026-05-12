# Opportunity Radar

Plataforma fullstack de prospecção comercial geolocalizada.

Faz scraping do Google Maps, persiste em CSV e exibe um mapa interativo com analytics.

## Stack

| Camada     | Tecnologia                           |
|------------|--------------------------------------|
| Backend    | Python 3.11+ · FastAPI · Uvicorn     |
| Scraping   | Playwright · BeautifulSoup           |
| Dados      | Pandas · CSV                         |
| Frontend   | React 18 · Vite · Tailwind CSS       |
| Mapa       | React Leaflet · react-leaflet-cluster|
| Charts     | Recharts                             |

---

## Estrutura

```
Radar-beta/
├── backend/
│   ├── api/          # Rotas FastAPI
│   ├── scraper/      # Playwright + BeautifulSoup
│   ├── services/     # DataService, SearchService
│   ├── utils/        # logger, geo helpers
│   ├── data/         # google_maps_master.csv (gerado)
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Sidebar, MapView, DetailPanel, OpportunityRadar
│   │   ├── hooks/        # useSearch (SSE streaming)
│   │   └── services/     # api.js (axios + SSE client)
│   ├── package.json
│   └── vite.config.js
├── start.bat     # Windows
├── start.sh      # Linux / macOS
└── README.md
```

---

## Instalação e execução

### Pré-requisitos

- Python 3.11+
- Node.js 20+

### 1 — Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
playwright install chromium

python main.py
```

API disponível em: http://localhost:8000
Swagger UI:        http://localhost:8000/docs

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponível em: http://localhost:5173

---

## Uso

1. Abra http://localhost:5173
2. Digite a **cidade** (ex: `Fortaleza, CE`)
3. Selecione ou digite uma **categoria** (ex: `barbearias`)
4. Clique **Buscar**
   - Se a categoria já existe no CSV → carrega instantaneamente
   - Se é nova → scraping automático com barra de progresso em tempo real
5. Explore o mapa, clique nos pins, veja detalhes e analytics

---

## API Endpoints

| Método | Rota                | Descrição                        |
|--------|---------------------|----------------------------------|
| GET    | /api/categories     | Categorias existentes no CSV     |
| GET    | /api/cities         | Cidades existentes no CSV        |
| GET    | /api/locations      | Locais por cidade e categoria    |
| GET    | /api/stats          | Estatísticas do dataset          |
| POST   | /api/search         | Busca bloqueante (sem stream)    |
| POST   | /api/search/stream  | Busca com SSE (progresso real)   |

### POST /api/search/stream — Eventos SSE

```json
{ "type": "found",    "total": 42 }
{ "type": "item",     "index": 1, "total": 42, "item": {...}, "added": true }
{ "type": "complete", "source": "scraping", "count": 38, "locations": [...] }
{ "type": "error",    "message": "..." }
```

---

## Dataset CSV

Salvo em `backend/data/google_maps_master.csv`.

Campos: `categoria, cidade, nome, telefone, email, website, instagram, facebook, linkedin, youtube, tiktok, endereco, latitude, longitude, maps_url`

- Incremental — nunca apaga dados existentes
- Deduplicação automática por `maps_url`
- Salvo após cada item (append seguro)

---

## Scripts de inicialização rápida

### Windows

```bat
start.bat
```

### Linux / macOS

```bash
chmod +x start.sh
./start.sh
```

---

## Notas

- O scraping do Google Maps pode ser bloqueado em uso intenso — adicione delays ou use proxies para uso em produção
- Coordenadas são extraídas da URL do Maps (padrão `@lat,lng` e `!3d...!4d...`)
- O dataset fica em `backend/data/` e persiste entre sessões
