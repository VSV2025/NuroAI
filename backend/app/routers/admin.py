import time
import datetime
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel

from ..models.user import (
    list_users, count_users, find_user_by_id,
    update_user, delete_user, list_audit_logs, create_audit_log,
)
from ..services.auth_service import get_current_user, require_admin
from ..db import get_db

router = APIRouter()


def _admin(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "No token provided")
    user = get_current_user(authorization[7:])
    require_admin(user)
    return user


@router.get("/overview")
def admin_overview(authorization: Optional[str] = Header(None)):
    _admin(authorization)
    db = get_db()
    return {
        "total_users": db["users"].count_documents({}),
        "active_users": db["users"].count_documents({"status": "active"}),
        "total_documents": db["documents"].count_documents({}),
        "ai_reports_generated": db["documents"].count_documents({"status": "complete"}),
        "system_health": "online",
    }


@router.get("/users")
def admin_list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: str = Query(""),
    authorization: Optional[str] = Header(None),
):
    _admin(authorization)
    users = list_users(skip=skip, limit=limit, search=search)
    total = count_users(search=search)
    return {"users": users, "total": total, "skip": skip, "limit": limit}


class UserUpdateBody(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None
    full_name: Optional[str] = None
    organization: Optional[str] = None


@router.put("/users/{user_id}")
def admin_update_user(user_id: str, body: UserUpdateBody, authorization: Optional[str] = Header(None)):
    admin = _admin(authorization)
    if not find_user_by_id(user_id):
        raise HTTPException(404, "User not found")
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if "role" in updates and updates["role"] not in ("admin", "researcher"):
        raise HTTPException(400, "role must be admin or researcher")
    if "status" in updates and updates["status"] not in ("active", "suspended"):
        raise HTTPException(400, "status must be active or suspended")
    updated = update_user(user_id, updates)
    create_audit_log(admin["id"], f"update_user:{user_id}", "admin")
    return updated


@router.delete("/users/{user_id}")
def admin_delete_user(user_id: str, authorization: Optional[str] = Header(None)):
    admin = _admin(authorization)
    if admin["id"] == user_id:
        raise HTTPException(400, "Cannot delete your own account")
    if not find_user_by_id(user_id):
        raise HTTPException(404, "User not found")
    delete_user(user_id)
    create_audit_log(admin["id"], f"delete_user:{user_id}", "admin")
    return {"status": "deleted"}


@router.get("/documents")
def admin_list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    authorization: Optional[str] = Header(None),
):
    _admin(authorization)
    db = get_db()
    docs = list(db["documents"].find({}, {"_id": 0}).sort("createdAt", -1).skip(skip).limit(limit))
    total = db["documents"].count_documents({})
    return {"documents": docs, "total": total}


@router.get("/audit-logs")
def admin_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    authorization: Optional[str] = Header(None),
):
    _admin(authorization)
    logs = list_audit_logs(skip=skip, limit=limit)
    return {"logs": logs, "total": len(logs)}


@router.get("/analytics")
def admin_analytics(authorization: Optional[str] = Header(None)):
    _admin(authorization)
    db = get_db()
    thirty_days_ago = time.time() - (30 * 24 * 3600)
    docs = list(db["documents"].find(
        {"createdAt": {"$gte": thirty_days_ago}},
        {"_id": 0, "createdAt": 1, "aiScore": 1, "status": 1},
    ))
    daily = defaultdict(lambda: {"uploads": 0, "ai_detections": 0})
    for d in docs:
        ts = d.get("createdAt", 0)
        day = datetime.datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d")
        daily[day]["uploads"] += 1
        if d.get("aiScore", 0) >= 60:
            daily[day]["ai_detections"] += 1
    return {"daily": [{"date": k, **v} for k, v in sorted(daily.items())]}
