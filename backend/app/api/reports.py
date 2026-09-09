"""
Field officer report submission and AI confidence validation endpoints.
"""
from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import VerificationReportRequest
from backend.app.services.risk_engine import haversine_distance
import datetime

router = APIRouter(prefix="/reports", tags=["reports"])

FIELD_REPORTS = []

@router.get("")
async def get_all_reports():
    return {"reports": FIELD_REPORTS, "count": len(FIELD_REPORTS)}

@router.post("")
async def submit_field_recon_report(req: VerificationReportRequest):
    dist_km = haversine_distance(req.lat, req.lng, 12.9772, 80.2215) # Default reference
    confidence_score = 40 if dist_km <= 1.0 else 20
    if req.evidence_photo_url:
        confidence_score += 35
    if req.severity in ["HIGH", "CRITICAL"]:
        confidence_score += 25

    confidence_level = "HIGH CONFIDENCE" if confidence_score >= 70 else "MEDIUM CONFIDENCE"

    report_record = {
        "id": f"REP-{int(datetime.datetime.utcnow().timestamp())}",
        "segment_id": req.segment_id,
        "officer_id": req.officer_id,
        "condition_type": req.condition_type,
        "severity": req.severity,
        "confidence": confidence_level,
        "confidence_score": confidence_score,
        "requires_control_room_review": confidence_score < 70,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    FIELD_REPORTS.append(report_record)
    return {"report": report_record, "success": True}
