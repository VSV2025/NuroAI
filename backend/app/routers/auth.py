import time
import uuid
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from ..models.user import (
    create_user, find_user_by_email, find_user_by_id,
    create_audit_log, save_reset_token, find_reset_token,
    delete_reset_token, update_user_password,
)
from ..services.auth_service import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


class SignupRequest(BaseModel):
    full_name: str
    organization: str = ""
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def _user_out(user: dict, token: str) -> dict:
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "organization": user.get("organization", ""),
            "email": user["email"],
            "role": user["role"],
            "status": user["status"],
            "created_at": user.get("created_at", 0),
        },
    }


@router.post("/signup")
def signup(body: SignupRequest):
    if not body.full_name.strip():
        raise HTTPException(400, "Full name is required")
    if not body.email.strip():
        raise HTTPException(400, "Email is required")
    if len(body.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    if find_user_by_email(body.email):
        raise HTTPException(400, "Email already registered")
    user = create_user(
        full_name=body.full_name.strip(),
        organization=body.organization.strip(),
        email=body.email,
        password_hash=hash_password(body.password),
    )
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    create_audit_log(user["id"], "signup", "auth")
    return _user_out(user, token)


@router.post("/login")
def login(body: LoginRequest):
    user = find_user_by_email(body.email)
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(401, "Invalid email or password")
    if user.get("status") == "suspended":
        raise HTTPException(403, "Account suspended — contact administrator")
    expires = timedelta(days=30) if body.remember_me else timedelta(hours=24)
    token = create_access_token({"sub": user["id"], "role": user["role"]}, expires_delta=expires)
    create_audit_log(user["id"], "login", "auth")
    return _user_out(user, token)


@router.post("/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        try:
            user = get_current_user(authorization[7:])
            create_audit_log(user["id"], "logout", "auth")
        except Exception:
            pass
    return {"status": "logged_out"}


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest):
    user = find_user_by_email(body.email)
    reset_token = str(uuid.uuid4())
    if user:
        save_reset_token(body.email.lower().strip(), reset_token, time.time() + 3600)
        create_audit_log(user["id"], "forgot_password", "auth")
    return {
        "status": "ok",
        "message": "If that email is registered, a reset token has been generated.",
        "reset_token": reset_token,
    }


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest):
    record = find_reset_token(body.token)
    if not record:
        raise HTTPException(400, "Invalid or expired reset token")
    if time.time() > record.get("expires_at", 0):
        delete_reset_token(body.token)
        raise HTTPException(400, "Reset token has expired — request a new one")
    if len(body.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    user = find_user_by_email(record["email"])
    if not user:
        raise HTTPException(400, "User not found")
    update_user_password(user["id"], hash_password(body.new_password))
    delete_reset_token(body.token)
    create_audit_log(user["id"], "reset_password", "auth")
    return {"status": "ok", "message": "Password updated successfully"}


@router.get("/me")
def get_me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "No token provided")
    user = get_current_user(authorization[7:])
    return {
        "id": user["id"],
        "full_name": user["full_name"],
        "organization": user.get("organization", ""),
        "email": user["email"],
        "role": user["role"],
        "status": user["status"],
        "created_at": user.get("created_at", 0),
    }
