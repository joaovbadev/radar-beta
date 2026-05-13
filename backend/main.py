import sys
import asyncio
import traceback
import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from api.routes import router
from utils.logger import setup_logger

load_dotenv()

logger = setup_logger(__name__)

# Windows: garantir ProactorEventLoop para Playwright
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Opportunity Radar API -- iniciada")
    yield
    logger.info("API encerrada")


app = FastAPI(
    title="Opportunity Radar API",
    description="Plataforma de prospeção comercial baseada em geolocalização",
    version="1.0.0",
    lifespan=lifespan,
)

# Parse CORS origins from environment (comma-separated, no spaces)
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
cors_origins = [origin.strip() for origin in cors_origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_exceptions(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        logger.error(
            "Unhandled exception on %s %s:\n%s",
            request.method,
            request.url.path,
            traceback.format_exc(),
        )
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc), "type": type(exc).__name__},
        )


app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Opportunity Radar API", "status": "running", "version": "1.0.0"}


if __name__ == "__main__":
    # reload=False evita conflitos com Playwright no Windows
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )
