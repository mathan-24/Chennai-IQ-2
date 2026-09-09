"""
Hazard detection and inspection task assignment endpoints.
"""
from fastapi import APIRouter
from typing import Optional

router = APIRouter(prefix="/hazards", tags=["hazards"])

HAZARD_LOG = []
INSPECTION_TASKS = []

@router.get("")
async def get_hazards():
    return {"hazards": HAZARD_LOG, "count": len(HAZARD_LOG)}

@router.get("/tasks")
async def get_inspection_tasks(officer_id: Optional[str] = None):
    if officer_id:
        return {"tasks": [t for t in INSPECTION_TASKS if t.get("assigned_officer_id") == officer_id]}
    return {"tasks": INSPECTION_TASKS}
