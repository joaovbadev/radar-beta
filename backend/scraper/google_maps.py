"""
Google Maps scraper using the SYNC Playwright API running in a thread executor.

Why sync instead of async?
On Windows, uvicorn's asyncio SelectorEventLoop does not support
asyncio.create_subprocess_exec(), which Playwright requires to launch the
browser. Using sync_playwright inside a ThreadPoolExecutor sidesteps the
issue entirely: the blocking work runs off the event loop, and progress
events are posted back via loop.call_soon_threadsafe().
"""

import asyncio
import re
import time
import concurrent.futures
from typing import Callable

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, Page, Browser

from utils.geo import extract_coordinates
from utils.logger import setup_logger
from services.data_service import DataService

logger = setup_logger(__name__)

SCROLL_TIMES = 12
MAX_RESULTS  = 60
ITEM_DELAY   = 1.0   # seconds between business page visits


class GoogleMapsScraper:
    def __init__(self, data_service: DataService):
        self.data_service = data_service

    # ------------------------------------------------------------------ #
    # Public async entry point — called from FastAPI route handlers
    # ------------------------------------------------------------------ #

    async def scrape(
        self,
        city: str,
        category: str,
        on_progress: Callable | None = None,
    ) -> list[dict]:
        loop = asyncio.get_running_loop()

        # Queue bridges the sync thread → async event loop
        queue: asyncio.Queue = asyncio.Queue()

        def _post(event: dict):
            # Guard: loop may be closed if the client disconnected
            try:
                if not loop.is_closed():
                    loop.call_soon_threadsafe(queue.put_nowait, event)
            except RuntimeError:
                pass

        def _run_sync():
            try:
                self._scrape_sync(city, category, _post)
            except Exception as exc:
                _post({"type": "_error", "message": str(exc)})
            finally:
                _post({"type": "_done"})

        # Start the blocking scraper in a thread
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        future   = loop.run_in_executor(executor, _run_sync)

        accumulated: list[dict] = []
        error_msg: str | None   = None

        # Drain the queue until the thread signals _done
        while True:
            event = await queue.get()

            if event["type"] == "_done":
                break

            if event["type"] == "_error":
                error_msg = event["message"]
                logger.error("Scraper thread error: %s", error_msg)
                break

            # Forward to caller (SSE stream)
            if on_progress:
                await on_progress(event)

            if event["type"] == "item" and event.get("item"):
                accumulated.append(event["item"])

        await future  # ensure thread is finished
        executor.shutdown(wait=False)

        return accumulated

    # ------------------------------------------------------------------ #
    # Sync scraping — runs in a ThreadPoolExecutor, never on the event loop
    # ------------------------------------------------------------------ #

    def _scrape_sync(self, city: str, category: str, post: Callable):
        query = f"{category} em {city}"
        url   = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"

        logger.info("Iniciando scraping: '%s'", query)
        logger.info("URL: %s", url)

        with sync_playwright() as pw:
            browser: Browser = pw.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                ],
            )
            context = browser.new_context(locale="pt-BR")
            page    = context.new_page()

            try:
                # "load" instead of "networkidle" — Maps keeps making background
                # requests indefinitely, so networkidle never fires.
                page.goto(url, timeout=60_000, wait_until="load")
                page.wait_for_timeout(4000)

                # Dismiss cookie/consent overlay if present
                try:
                    page.click('button[aria-label*="Aceitar"]', timeout=2000)
                except Exception:
                    pass

                self._scroll_feed(page)

                links = self._collect_links(page)
                total = min(len(links), MAX_RESULTS)
                logger.info("%d locais encontrados", total)

                post({"type": "found", "total": total})

                visited: set[str] = set()

                for idx, link in enumerate(links[:MAX_RESULTS], start=1):
                    if link in visited:
                        continue
                    visited.add(link)

                    try:
                        logger.info("[%d/%d] Processando...", idx, total)
                        item = self._extract_place(page, link, city, category)

                        if item:
                            added = self.data_service.append_item(item)
                            post({
                                "type":  "item",
                                "index": idx,
                                "total": total,
                                "item":  item,
                                "added": added,
                            })
                    except Exception as exc:
                        logger.error("Erro no item %d: %s", idx, exc)

                    time.sleep(ITEM_DELAY)

            except Exception as exc:
                logger.error("Erro geral no scraping: %s", exc)
                raise
            finally:
                browser.close()

        logger.info("Scraping concluido: %d itens para '%s'", total if 'total' in dir() else 0, query)

    # ------------------------------------------------------------------ #
    # Scroll / link collection
    # ------------------------------------------------------------------ #

    def _scroll_feed(self, page: Page):
        try:
            for i in range(SCROLL_TIMES):
                page.evaluate("""
                    const feed = document.querySelector('[role="feed"]');
                    if (feed) feed.scrollBy(0, 2000);
                """)
                page.wait_for_timeout(1200)
        except Exception as exc:
            logger.warning("Scroll falhou: %s", exc)

    def _collect_links(self, page: Page) -> list[str]:
        try:
            links: list[str] = page.evaluate("""
                () => {
                    const hrefs = [...document.querySelectorAll('a[href*="/maps/place/"]')]
                        .map(a => a.href);
                    return [...new Set(hrefs)];
                }
            """)
            return links
        except Exception:
            return []

    # ------------------------------------------------------------------ #
    # Per-place extraction
    # ------------------------------------------------------------------ #

    def _extract_place(
        self, page: Page, url: str, city: str, category: str
    ) -> dict | None:
        page.goto(url, timeout=30_000, wait_until="load")
        page.wait_for_timeout(2500)

        current_url = page.url
        lat, lng    = extract_coordinates(current_url)

        html = page.content()
        soup = BeautifulSoup(html, "lxml")
        name = self._parse_name(soup)

        if not name or name.lower() in ("resultados", "results"):
            return None

        phone   = self._aria_value(page, "Telefone")   or self._regex_phone(soup.get_text(" "))
        address = self._aria_value(page, "Endereço")
        website = self._website(page)
        email   = self._regex_email(soup.get_text(" "))

        page_html = page.content()
        return {
            "categoria":  category,
            "cidade":     city,
            "nome":       name,
            "telefone":   phone,
            "email":      email,
            "website":    website,
            "instagram":  self._social(page_html, "instagram.com"),
            "facebook":   self._social(page_html, "facebook.com"),
            "linkedin":   self._social(page_html, "linkedin.com"),
            "youtube":    self._social(page_html, "youtube.com"),
            "tiktok":     self._social(page_html, "tiktok.com"),
            "endereco":   address,
            "latitude":   lat,
            "longitude":  lng,
            "maps_url":   url,
        }

    # ------------------------------------------------------------------ #
    # Field helpers
    # ------------------------------------------------------------------ #

    def _parse_name(self, soup: BeautifulSoup) -> str:
        for sel in ["h1.DUwDvf", "h1[class*='fontHeadline']", "h1"]:
            el = soup.select_one(sel)
            if el:
                text = el.get_text(strip=True)
                if text:
                    return text
        return ""

    def _aria_value(self, page: Page, keyword: str) -> str:
        try:
            els = page.query_selector_all(f'[aria-label*="{keyword}"]')
            for el in els:
                label = el.get_attribute("aria-label") or ""
                if keyword in label:
                    value = label.split(":", 1)[-1].strip()
                    if value and value != keyword:
                        return value
        except Exception:
            pass
        return ""

    def _website(self, page: Page) -> str:
        try:
            el = page.query_selector('a[data-item-id="authority"]')
            if el:
                href = el.get_attribute("href") or ""
                if href:
                    return href
            for el in page.query_selector_all('a[href^="http"]'):
                href = el.get_attribute("href") or ""
                if href and "google" not in href and "gstatic" not in href:
                    return href
        except Exception:
            pass
        return ""

    def _regex_phone(self, text: str) -> str:
        m = re.search(r"(\+?\d{1,3}\s?)?(\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}", text)
        return m.group(0).strip() if m else ""

    def _regex_email(self, text: str) -> str:
        for m in re.findall(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text):
            if not any(m.lower().endswith(b) for b in (".png", ".jpg", ".jpeg", ".webp")):
                return m
        return ""

    def _social(self, html: str, domain: str) -> str:
        soup = BeautifulSoup(html, "lxml")
        for a in soup.find_all("a", href=True):
            if domain in a["href"]:
                return a["href"]
        return ""
