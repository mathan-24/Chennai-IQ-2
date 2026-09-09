"""
CHENNAI-IQ — AI-Assisted Flood Access Risk Mapping & Dynamic Routing for Chennai
FastAPI REST Services & Analytical Engine
Spatial operations powered by PostGIS; Routing evaluation powered by OSRM candidate integration.
"""

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import datetime
import math

app = FastAPI(
    title="CHENNAI-IQ Flood Access Risk & Dynamic Routing API",
    description="Computational road-segment flood-access risk monitoring, hazard detection, nearest field officer dispatch, and dynamic flood-aware route evaluation for Chennai.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------------
# IN-MEMORY STATE & MOCK SEED (Syncable with PostGIS / Supabase)
# -------------------------------------------------------------------------

current_rainfall_mm = 75.0
simulation_mode = True

ROAD_SEGMENTS = [
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

FIELD_OFFICERS = [
    {
        "id": "FO-02",
        "name": "Sub-Inspector M. Selvam",
        "badge": "TN-POL-4102",
        "station": "Velachery Traffic & Recon Post",
        "status": "AVAILABLE",
        "sector": "Zone 13 - South Chennai",
        "lat": 12.9780,
        "lng": 80.2195
    },
    {
        "id": "FO-01",
        "name": "Inspector K. Saravanan",
        "badge": "TN-POL-3981",
        "station": "Guindy Kathipara Control Post",
        "status": "AVAILABLE",
        "sector": "Zone 12 - Guindy / Alandur",
        "lat": 13.0070,
        "lng": 80.2050
    },
    {
        "id": "FO-03",
        "name": "Officer Priya R.",
        "badge": "TN-POL-5204",
        "station": "Sholinganallur Junction Outpost",
        "status": "BUSY",
        "sector": "Zone 14 - OMR IT Corridor",
        "lat": 12.9010,
        "lng": 80.2280
    }
]

ACTIVE_TRIPS = [
    {
        "trip_id": "TRIP-001",
        "driver_id": "DRV-104",
        "driver_name": "Rajesh Kumar",
        "vehicle_id": "TRK-104",
        "active_route": "Route A (Velachery Corridor)",
        "route_segments": ["S222", "S217", "S221"],
        "status": "ACTIVE"
    },
    {
        "trip_id": "TRIP-002",
        "driver_id": "DRV-208",
        "driver_name": "S. Murugan",
        "vehicle_id": "TRK-208",
        "active_route": "Route B (GST Road / Kathipara)",
        "route_segments": ["S219", "S221"],
        "status": "ACTIVE"
    }
]

HAZARD_EVENTS = []
INSPECTION_TASKS = []
FIELD_REPORTS = []
DRIVER_ALERTS = []
AUDIT_LOGS = []

# -------------------------------------------------------------------------
# PROTOTYPE RISK ENGINE & HELPER FUNCTIONS
# -------------------------------------------------------------------------

def calculate_risk(rainfall_mm: float, elevation: float, drainage: float, road_vuln: float) -> dict:
    """
    Transparent prototype risk engine formula:
    risk_score = 100 * (
        0.45 * rainfall_factor +
        0.25 * elevation_factor +
        0.20 * drainage_factor +
        0.10 * road_vulnerability_factor
    )
    All factors normalized between 0 and 1.
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

def haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

# -------------------------------------------------------------------------
# REST ENDPOINTS
# -------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    return {
        "status": "OPERATIONAL",
        "service": "CHENNAI-IQ Flood Access Risk Engine",
        "sector": "Chennai Metropolitan Area",
        "rainfall_mm": current_rainfall_mm,
        "mode": "SIMULATION MODE" if simulation_mode else "LIVE DATA"
    }

@app.get("/api/roads")
async def get_road_segments():
    """Retrieve all monitored road segments with continuous risk scores."""
    result = []
    for s in ROAD_SEGMENTS:
        calc = calculate_risk(
            current_rainfall_mm,
            s["elevation_susceptibility"],
            s["drainage_susceptibility"],
            s["road_vulnerability"]
        )
        result.append({
            **s,
            "current_risk_score": calc["score"],
            "current_risk_level": calc["level"],
            "factors": calc["factors"],
            "current_rainfall_mm": current_rainfall_mm
        })
    return {"roads": result, "count": len(result)}

@app.get("/api/roads/{segment_id}/risk")
async def get_segment_risk(segment_id: str):
    seg = next((s for s in ROAD_SEGMENTS if s["segment_id"] == segment_id), None)
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")
    calc = calculate_risk(
        current_rainfall_mm,
        seg["elevation_susceptibility"],
        seg["drainage_susceptibility"],
        seg["road_vulnerability"]
    )
    return {
        "segment_id": segment_id,
        "road_name": seg["road_name"],
        "operational_status": seg["operational_status"],
        "risk_calculation": calc,
        "formula_disclaimer": "Prototype empirical formula for demonstration. Not officially validated flood predictions."
    }

class RainfallUpdateRequest(BaseModel):
    rainfall_mm: float = Field(..., ge=0, le=500)
    is_simulation: bool = True

@app.post("/api/rainfall")
async def update_rainfall(req: RainfallUpdateRequest):
    global current_rainfall_mm, simulation_mode
    old_rain = current_rainfall_mm
    current_rainfall_mm = req.rainfall_mm
    simulation_mode = req.is_simulation

    # Recalculate road segment risk and detect meaningful transitions
    detected = []
    for s in ROAD_SEGMENTS:
        old_calc = calculate_risk(old_rain, s["elevation_susceptibility"], s["drainage_susceptibility"], s["road_vulnerability"])
        new_calc = calculate_risk(current_rainfall_mm, s["elevation_susceptibility"], s["drainage_susceptibility"], s["road_vulnerability"])

        # Trigger if crossed into HIGH or CRITICAL
        if old_calc["level"] in ["LOW", "MODERATE"] and new_calc["level"] in ["HIGH", "CRITICAL"]:
            haz_id = f"HAZ-{s['segment_id']}-{int(datetime.datetime.utcnow().timestamp())}"
            hazard = {
                "id": haz_id,
                "segment_id": s["segment_id"],
                "road_name": s["road_name"],
                "severity": new_calc["level"],
                "reason": f"Precipitation increased to {current_rainfall_mm}mm. Risk score elevated from {old_calc['score']} to {new_calc['score']}.",
                "status": "ACTIVE_UNVERIFIED"
            }
            HAZARD_EVENTS.append(hazard)
            detected.append(hazard)

            # Auto-assign nearest field officer
            avail = [o for o in FIELD_OFFICERS if o["status"] == "AVAILABLE"]
            seg_center = s["coordinates"][len(s["coordinates"]) // 2]
            if avail:
                ranked = sorted(avail, key=lambda o: haversine_km(o["lat"], o["lng"], seg_center[0], seg_center[1]))
                assigned_officer = ranked[0]
                task_id = f"TASK-{s['segment_id']}-{int(datetime.datetime.utcnow().timestamp())}"
                task = {
                    "id": task_id,
                    "hazard_id": haz_id,
                    "segment_id": s["segment_id"],
                    "road_name": s["road_name"],
                    "assigned_officer_id": assigned_officer["id"],
                    "assigned_officer_name": assigned_officer["name"],
                    "distance_km": haversine_km(assigned_officer["lat"], assigned_officer["lng"], seg_center[0], seg_center[1]),
                    "priority": new_calc["level"],
                    "status": "ASSIGNED"
                }
                INSPECTION_TASKS.append(task)

    return {
        "previous_rainfall_mm": old_rain,
        "current_rainfall_mm": current_rainfall_mm,
        "mode": "SIMULATION MODE" if simulation_mode else "LIVE DATA",
        "new_hazards_detected": detected
    }

@app.get("/api/hazards")
async def get_hazards():
    return {"hazards": HAZARD_EVENTS}

@app.get("/api/tasks")
async def get_tasks(officer_id: Optional[str] = None):
    if officer_id:
        filtered = [t for t in INSPECTION_TASKS if t["assigned_officer_id"] == officer_id]
        return {"tasks": filtered}
    return {"tasks": INSPECTION_TASKS}

class VerificationReportRequest(BaseModel):
    task_id: Optional[str] = None
    officer_id: str
    segment_id: str
    condition_type: str # 'flooding', 'waterlogging', 'complete blockage', etc.
    severity: str
    description: str
    lat: float
    lng: float
    evidence_photo_url: Optional[str] = None

@app.post("/api/reports")
async def submit_field_report(req: VerificationReportRequest):
    """
    Submits field report, runs AI-assisted verification confidence engine,
    and automatically updates road status if confidence is high, or queues for Control Room if uncertain/conflicting.
    """
    seg = next((s for s in ROAD_SEGMENTS if s["segment_id"] == req.segment_id), None)
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")

    # Spatial match
    seg_center = seg["coordinates"][len(seg["coordinates"]) // 2]
    dist_km = haversine_km(req.lat, req.lng, seg_center[0], seg_center[1])

    confidence_score = 0
    reasons = []

    if dist_km <= 0.5:
        confidence_score += 40
        reasons.append(f"GPS telemetry locked onto corridor ({round(dist_km*1000)}m offset).")
    else:
        confidence_score += 15
        reasons.append(f"GPS telemetry offset {dist_km} km from segment center.")

    if req.evidence_photo_url:
        confidence_score += 35
        reasons.append("Photographic evidence attached.")

    if current_rainfall_mm >= 100 and req.severity in ["HIGH", "CRITICAL"]:
        confidence_score += 25
        reasons.append("Report physically consistent with intensive monsoonal rainfall.")

    if confidence_score >= 70:
        confidence_level = "HIGH CONFIDENCE"
        requires_review = False
        new_status = "BLOCKED" if req.condition_type in ["complete blockage", "flooding"] else "WATERLOGGED"
        seg["operational_status"] = new_status
    else:
        confidence_level = "MEDIUM CONFIDENCE"
        requires_review = True
        new_status = "UNDER VERIFICATION"
        seg["operational_status"] = new_status

    report_id = f"REP-{int(datetime.datetime.utcnow().timestamp())}"
    report_record = {
        "id": report_id,
        "segment_id": req.segment_id,
        "officer_id": req.officer_id,
        "condition_type": req.condition_type,
        "severity": req.severity,
        "confidence": confidence_level,
        "confidence_score": confidence_score,
        "reasons": reasons,
        "requires_control_room_review": requires_review,
        "updated_road_status": seg["operational_status"]
    }
    FIELD_REPORTS.append(report_record)

    # Active trip impact check: Alert affected drivers
    affected = []
    if seg["operational_status"] == "BLOCKED":
        for trip in ACTIVE_TRIPS:
            if req.segment_id in trip["route_segments"]:
                alert = {
                    "id": f"ALT-{int(datetime.datetime.utcnow().timestamp())}",
                    "trip_id": trip["trip_id"],
                    "driver_id": trip["driver_id"],
                    "driver_name": trip["driver_name"],
                    "vehicle_id": trip["vehicle_id"],
                    "title": f"CRITICAL FLOOD DISRUPTION: Road {req.segment_id} BLOCKED",
                    "message": f"{seg['road_name']} confirmed impassable. Route B (GST Elevated Bypass) recommended.",
                    "recommended_route": "Route B"
                }
                DRIVER_ALERTS.append(alert)
                affected.append(alert)

    return {
        "report": report_record,
        "affected_drivers_alerted": affected
    }

@app.get("/api/trips")
async def get_active_trips():
    return {"trips": ACTIVE_TRIPS}

@app.get("/api/alerts")
async def get_alerts(driver_id: Optional[str] = None):
    if driver_id:
        return {"alerts": [a for a in DRIVER_ALERTS if a["driver_id"] == driver_id]}
    return {"alerts": DRIVER_ALERTS}
