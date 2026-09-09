"""
Authentication and role verification endpoints.
"""
from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import LoginRequest, VerifyRoleRequest

router = APIRouter(prefix="/auth", tags=["auth"])

USER_ACCOUNTS = {
    "command@routeiq.internal": {
        "id": "CR-01",
        "name": "Commander M. Ramanathan",
        "role": "CONTROL_ROOM",
        "password": "Command2026!"
    },
    "driver.rajesh@routeiq.internal": {
        "id": "DRV-104",
        "name": "Rajesh Kumar",
        "role": "DRIVER",
        "password": "Driver2026!"
    },
    "officer.selvam@routeiq.internal": {
        "id": "FO-02",
        "name": "Sub-Inspector M. Selvam",
        "role": "FIELD_OFFICER",
        "password": "Officer2026!"
    }
}

@router.post("/login")
async def login(payload: LoginRequest):
    user = USER_ACCOUNTS.get(payload.email)
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid official credentials or identifier.")
    return {
        "success": True,
        "token": f"mock-token-{user['id']}-2026",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": payload.email,
            "role": user["role"]
        },
        "role": user["role"],
        "requires2FA": True
    }

@router.post("/verify-role")
async def verify_role(payload: VerifyRoleRequest):
    return {
        "success": True,
        "message": f"Security clearance confirmed for role {payload.role}.",
        "verified": True
    }
