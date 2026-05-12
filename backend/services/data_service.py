import pandas as pd
from pathlib import Path
from utils.logger import setup_logger

logger = setup_logger(__name__)

CSV_PATH = Path(__file__).parent.parent / "data" / "google_maps_master.csv"

COLUMNS = [
    "categoria", "cidade", "nome", "telefone", "email",
    "website", "instagram", "facebook", "linkedin",
    "youtube", "tiktok", "endereco", "latitude", "longitude", "maps_url",
]


class DataService:
    def __init__(self):
        self._ensure_csv()

    def _ensure_csv(self):
        CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
        if not CSV_PATH.exists():
            pd.DataFrame(columns=COLUMNS).to_csv(CSV_PATH, index=False)
            logger.info("📄 CSV criado em %s", CSV_PATH)

    def _load(self) -> pd.DataFrame:
        df = pd.read_csv(CSV_PATH, dtype=str)
        return df.fillna("")

    def _save(self, df: pd.DataFrame):
        df.to_csv(CSV_PATH, index=False)

    # ------------------------------------------------------------------ #

    def get_categories(self) -> list[str]:
        df = self._load()
        if df.empty:
            return []
        return sorted(df["categoria"].str.strip().unique().tolist())

    def get_cities(self) -> list[str]:
        df = self._load()
        if df.empty:
            return []
        return sorted(df["cidade"].str.strip().unique().tolist())

    def get_locations(self, city: str, category: str) -> list[dict]:
        df = self._load()
        mask = (
            df["cidade"].str.lower().str.strip() == city.lower().strip()
        ) & (
            df["categoria"].str.lower().str.strip() == category.lower().strip()
        )
        return df[mask].to_dict(orient="records")

    def category_exists(self, city: str, category: str) -> bool:
        df = self._load()
        if df.empty:
            return False
        mask = (
            df["cidade"].str.lower().str.strip() == city.lower().strip()
        ) & (
            df["categoria"].str.lower().str.strip() == category.lower().strip()
        )
        return mask.any()

    def append_item(self, item: dict) -> bool:
        """Append a single item. Returns True if added, False if duplicate."""
        df = self._load()
        existing_urls = set(df["maps_url"].tolist())

        url = item.get("maps_url", "")
        if url and url in existing_urls:
            logger.debug("⏭️  Duplicata ignorada: %s", item.get("nome", url))
            return False

        row = {col: item.get(col, "") for col in COLUMNS}
        new_row = pd.DataFrame([row])
        combined = pd.concat([df, new_row], ignore_index=True)
        self._save(combined)
        logger.info(
            "✅ [+%d] %s — %s",
            len(combined),
            item.get("nome", "?"),
            item.get("cidade", "?"),
        )
        return True

    def get_stats(self) -> dict:
        df = self._load()
        if df.empty:
            return {"total": 0, "by_category": {}, "by_city": {}}
        return {
            "total": len(df),
            "by_category": df["categoria"].value_counts().to_dict(),
            "by_city": df["cidade"].value_counts().to_dict(),
        }
