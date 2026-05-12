import asyncio
import json
from typing import AsyncGenerator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.data_service import DataService
from services.search_service import SearchService
from utils.logger import setup_logger

logger = setup_logger(__name__)

router = APIRouter()
data_service = DataService()
search_service = SearchService(data_service)


class SearchRequest(BaseModel):
    city: str
    category: str


# ------------------------------------------------------------------ #
# Simple endpoints
# ------------------------------------------------------------------ #


@router.get("/categories")
async def get_categories():
    return data_service.get_categories()


@router.get("/cities")
async def get_cities():
    return data_service.get_cities()


@router.get("/locations")
async def get_locations(city: str, category: str):
    return data_service.get_locations(city, category)


@router.get("/stats")
async def get_stats():
    return data_service.get_stats()


# ------------------------------------------------------------------ #
# Streaming search (SSE)
# ------------------------------------------------------------------ #


@router.post("/search/stream")
async def search_stream(req: SearchRequest):
    """
    Server-Sent Events endpoint that streams scraping progress in real time.

    Event types:
    - status   : informational message
    - found    : total places found
    - item     : a single place was processed
    - complete : all done, includes full locations array
    - error    : something went wrong
    """

    async def event_stream() -> AsyncGenerator[str, None]:
        queue: asyncio.Queue = asyncio.Queue()

        async def on_progress(event: dict):
            await queue.put(event)

        async def run_search():
            try:
                result = await search_service.search(
                    req.city, req.category, on_progress
                )
                await queue.put({"type": "complete", **result})
            except Exception as exc:
                logger.error("Search error: %s", exc)
                await queue.put({"type": "error", "message": str(exc)})
            finally:
                await queue.put(None)  # sentinel

        task = asyncio.create_task(run_search())

        # Yield SSE events as they arrive
        while True:
            event = await queue.get()
            if event is None:
                break
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

        await task

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ------------------------------------------------------------------ #
# Non-streaming search (fallback)
# ------------------------------------------------------------------ #


@router.post("/search")
async def search(req: SearchRequest):
    return await search_service.search(req.city, req.category)
