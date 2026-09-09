"""
Road corridor risk endpoints and spatial telemetry queries.
"""
from fastapi import APIRouter, HTTPException
from backend.app.services.risk_engine import calculate_corridor_risk
import datetime

router = APIRouter(prefix="/roads", tags=["roads"])

CHENNAI_ROAD_SEGMENTS = [
    {
        "segment_id": "S217",
        "road_name": "Velachery Main Road (Vijayanagar - Lake Section)",
        "road_type": "Primary Arterial",
        "zone": "Zone 13 - South Chennai",
        "elevation_susceptibility": 0.90,
        "drainage_susceptibility": 0.85,
        "road_vulnerability": 0.70,
        "operational_status": "NORMAL",
        "coordinates": [[12.9815, 80.2180], [12.9772, 80.2215], [12.9710, 80.2235], [12.9640, 80.2210]],
        "last_risk_update": datetime.datetime.utcnow().isoformat()
    },
    {
        "segment_id": "S218",
        "road_name": "OMR IT Expressway (Perungudi - SRP)",
        "road_type": "Major Dual-Carriageway Expressway",
        "zone": "Zone 14 - OMR IT Corridor",
        "elevation_susceptibility": 0.65,
        "drainage_susceptibility": 0.60,
        "road_vulnerability": 0.45,
        "operational_status": "NORMAL",
        "coordinates": [[12.9660, 80.2450], [12.9550, 80.2465], [12.9420, 80.2440], [12.9310, 80.2415]],
        "last_risk_update": datetime.datetime.utcnow().isoformat()
    },
    {
        "segment_id": "S219",
        "road_name": "GST Road (Kathipara - Guindy Flyover)",
        "road_type": "National Highway Grade Expressway",
        "zone": "Zone 12 - Guindy Hub",
        "elevation_susceptibility": 0.25,
        "drainage_susceptibility": 0.30,
        "road_vulnerability": 0.30,
        "operational_status": "NORMAL",
        "coordinates": [[12.9960, 80.1980], [13.0030, 80.2035], [13.0085, 80.2110], [13.0130, 80.2185]],
        "last_risk_update": datetime.datetime.utcnow().isoformat()
    },
    {
        "segment_id": "S220",
        "road_name": "Poonamallee High Road (Koyambedu Stretch)",
        "road_type": "Primary Arterial Corridor",
        "zone": "Zone 10 - Koyambedu",
        "elevation_susceptibility": 0.55,
        "drainage_susceptibility": 0.50,
        "road_vulnerability": 0.40,
        "operational_status": "NORMAL",
        "coordinates": [[13.0680, 80.1920], [13.0695, 80.2050], [13.0720, 80.2180], [13.0745, 80.2310]],
        "last_risk_update": datetime.datetime.utcnow().isoformat()
    },
    {
        "segment_id": "S221",
        "road_name": "Anna Salai (Saidapet Adyar River Bridge)",
        "road_type": "Major Metro Arterial",
        "zone": "Zone 9 - Saidapet",
        "elevation_susceptibility": 0.45,
        "drainage_susceptibility": 0.40,
        "road_vulnerability": 0.35,
        "operational_status": "NORMAL",
        "coordinates": [[13.0180, 80.2220], [13.0235, 80.2280], [13.0310, 80.2340], [13.0400, 80.2410]],
        "last_risk_update": datetime.datetime.utcnow().isoformat()
    },
    {
        "segment_id": "S222",
        "road_name": "200 Feet Radial Road (Pallavaram - Thoraipakkam)",
        "road_type": "Arterial Link Road",
        "zone": "Zone 14 - Pallikaranai Perimeter",
        "elevation_susceptibility": 0.78,
        "drainage_susceptibility": 0.75,
        "road_vulnerability": 0.60,
        "operational_status": "NORMAL",
        "coordinates": [[12.9550, 80.1650], [12.9520, 80.1850], [12.9490, 80.2050], [12.9460, 80.2250]],
        "last_risk_update": datetime.datetime.utcnow().isoformat()
    }
]

@router.get("")
async def get_all_road_segments(rainfall_mm: float = 75.0):
    result = []
    for s in CHENNAI_ROAD_SEGMENTS:
        calc = calculate_corridor_risk(
            rainfall_mm,
            s["elevation_susceptibility"],
            s["drainage_susceptibility"],
            s["road_vulnerability"]
        )
        result.append({
            **s,
            "current_risk_score": calc["score"],
            "current_risk_level": calc["level"],
            "factors": calc["factors"],
            "current_rainfall_mm": rainfall_mm
        })
    return {"roads": result, "count": len(result)}

@router.get("/{segment_id}/risk")
async def get_segment_risk(segment_id: str, rainfall_mm: float = 75.0):
    seg = next((s for s in CHENNAI_ROAD_SEGMENTS if s["segment_id"] == segment_id), None)
    if not seg:
        raise HTTPException(status_code=404, detail=f"Corridor segment {segment_id} not found")
    calc = calculate_corridor_risk(
        rainfall_mm,
        seg["elevation_susceptibility"],
        seg["drainage_susceptibility"],
        seg["road_vulnerability"]
    )
    return {
        "segment_id": segment_id,
        "road_name": seg["road_name"],
        "operational_status": seg["operational_status"],
        "risk_calculation": calc
    }
