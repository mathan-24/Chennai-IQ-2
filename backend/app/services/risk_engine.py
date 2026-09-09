"""
Computational Flood Risk Engine for Chennai arterial road corridors.
Calculates continuous multi-factor risk scores incorporating elevation, drainage, and precipitation.
"""
import math

def calculate_corridor_risk(rainfall_mm: float, elevation: float, drainage: float, road_vuln: float) -> dict:
    """
    Transparent Chennai-IQ empirical risk formula:
    risk_score = 100 * (
        0.45 * rainfall_factor +
        0.25 * elevation_factor +
        0.20 * drainage_factor +
        0.10 * road_vulnerability_factor
    )
    All factors normalized between 0.0 and 1.0.
    """
    rainfall_factor = min(1.0, max(0.0, rainfall_mm / 250.0))
    elevation_factor = min(1.0, max(0.0, elevation))
    drainage_factor = min(1.0, max(0.0, drainage))
    road_vuln_factor = min(1.0, max(0.0, road_vuln))

    weighted = (
        0.45 * rainfall_factor +
        0.25 * elevation_factor +
        0.20 * drainage_factor +
        0.10 * road_vuln_factor
    )
    score = round(100.0 * weighted)
    score = max(0, min(100, score))

    if score > 80:
        level = "CRITICAL"
    elif score > 60:
        level = "HIGH"
    elif score > 30:
        level = "MODERATE"
    else:
        level = "LOW"

    return {
        "score": score,
        "level": level,
        "factors": {
            "rainfall_factor": round(rainfall_factor, 2),
            "elevation_factor": round(elevation_factor, 2),
            "drainage_factor": round(drainage_factor, 2),
            "road_vulnerability_factor": round(road_vuln_factor, 2)
        }
    }

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)
