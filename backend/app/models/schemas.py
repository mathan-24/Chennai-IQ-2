"""
Pydantic schemas and data models for CHENNAI-IQ backend services.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RainfallUpdateRequest(BaseModel):
    rainfall_mm: float = Field(..., ge=0, le=500, description="Rainfall intensity in millimeters")
    is_simulation: bool = True

class VerificationReportRequest(BaseModel):
    task_id: Optional[str] = None
    officer_id: str
    segment_id: str
    condition_type: str # 'flooding', 'waterlogging', 'complete blockage'
    severity: str # 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'
    description: str
    lat: float
    lng: float
    evidence_photo_url: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class VerifyRoleRequest(BaseModel):
    role: str
    verification_code: Optional[str] = None
    token: Optional[str] = None

class RoadRiskResponse(BaseModel):
    segment_id: str
    road_name: str
    current_risk_score: int
    current_risk_level: str
    operational_status: str
    factors: Dict[str, float]
