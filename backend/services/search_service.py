from services.data_service import DataService
from scraper.google_maps import GoogleMapsScraper
from utils.logger import setup_logger

logger = setup_logger(__name__)


class SearchService:
    def __init__(self, data_service: DataService):
        self.data_service = data_service
        self.scraper = GoogleMapsScraper(data_service)

    async def search(
        self,
        city: str,
        category: str,
        on_progress=None,
    ) -> dict:
        category = category.strip().lower()
        city = city.strip()

        if self.data_service.category_exists(city, category):
            logger.info(
                "📦 Cache hit: categoria='%s' cidade='%s'", category, city
            )
            locations = self.data_service.get_locations(city, category)
            return {
                "source": "cache",
                "count": len(locations),
                "locations": locations,
            }

        logger.info(
            "🕷️ Scraping: categoria='%s' cidade='%s'", category, city
        )
        locations = await self.scraper.scrape(city, category, on_progress)

        return {
            "source": "scraping",
            "count": len(locations),
            "locations": locations,
        }
