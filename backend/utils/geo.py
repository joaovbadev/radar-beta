import re


def extract_coordinates(url: str) -> tuple[str, str]:
    """
    Extracts (latitude, longitude) from a Google Maps URL.

    Supports two common patterns:
    1. @lat,lng,zoom   →  .../place/.../@-19.9325,-43.9374,17z/...
    2. !3d<lat>!4d<lng>  →  .../data=...!3d-19.9325!4d-43.9374...
    """
    # Pattern 1 — @lat,lng
    match = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url)
    if match:
        return match.group(1), match.group(2)

    # Pattern 2 — !3d and !4d
    lat_m = re.search(r"!3d(-?\d+\.\d+)", url)
    lng_m = re.search(r"!4d(-?\d+\.\d+)", url)
    if lat_m and lng_m:
        return lat_m.group(1), lng_m.group(1)

    return "", ""
