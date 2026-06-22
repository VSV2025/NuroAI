from typing import Optional

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from ..models.user import find_user_by_id, update_user, create_audit_log
from ..services.auth_service import get_current_user
from ..db import get_db

router = APIRouter()


def _auth(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "No token provided")
    return get_current_user(authorization[7:])


@router.get("/me/dashboard")
def user_dashboard(authorization: Optional[str] = Header(None)):
    user = _auth(authorization)
    db = get_db()
    docs = list(db["documents"].find(
        {},
        {"_id": 0, "id": 1, "filename": 1, "status": 1, "createdAt": 1, "aiScore": 1, "risk": 1},
    ).sort("createdAt", -1).limit(20))
    total_docs = db["documents"].count_documents({})
    return {
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "organization": user.get("organization", ""),
            "email": user["email"],
            "role": user["role"],
        },
        "stats": {
            "documents_uploaded": total_docs,
            "ai_detections": db["documents"].count_documents({"aiScore": {"$gte": 60}}),
            "plagiarism_flags": db["documents"].count_documents({"risk": {"$in": ["HIGH", "CRITICAL"]}}),
        },
        "recent_documents": docs,
    }


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    organization: Optional[str] = None


@router.put("/me")
def update_profile(body: ProfileUpdate, authorization: Optional[str] = Header(None)):
    user = _auth(authorization)
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields to update")
    updated = update_user(user["id"], updates)
    create_audit_log(user["id"], "update_profile", "users")
    return {
        "id": updated["id"],
        "full_name": updated["full_name"],
        "organization": updated.get("organization", ""),
        "email": updated["email"],
        "role": updated["role"],
    }
