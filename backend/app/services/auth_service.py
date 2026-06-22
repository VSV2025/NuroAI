import os
import hashlib
import hmac
import secrets
import time
from typing import Optional

SECRET_KEY = os.environ.get("SECRET_KEY", "nuroai-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 24 * 3600

# --- Password hashing: prefer bcrypt via passlib, fall back to PBKDF2 ---
try:
    from passlib.context import CryptContext
    _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    _USE_PASSLIB = True
except Exception:
    _pwd_context = None
    _USE_PASSLIB = False


def hash_password(plain: str) -> str:
    if _USE_PASSLIB and _pwd_context is not None:
        try:
            return _pwd_context.hash(plain)
        except Exception:
            pass
    salt = secrets.token_hex(32)
    h = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt.encode("utf-8"), 260000).hex()
    return f"pbkdf2:{salt}:{h}"


def verify_password(plain: str, hashed: str) -> bool:
    if hashed.startswith("pbkdf2:"):
        parts = hashed.split(":")
        if len(parts) != 3:
            return False
        _, salt, stored = parts
        h = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt.encode("utf-8"), 260000).hex()
        return hmac.compare_digest(h, stored)
    if _USE_PASSLIB and _pwd_context is not None:
        try:
            return _pwd_context.verify(plain, hashed)
        except Exception:
            return False
    return False


# --- JWT: prefer PyJWT, fall back to simple HMAC tokens ---
try:
    import jwt as _pyjwt
    _USE_JWT = True
except ImportError:
    _pyjwt = None
    _USE_JWT = False


def create_access_token(data: dict, expires_delta: Optional[int] = None) -> str:
    exp = int(time.time()) + (expires_delta or ACCESS_TOKEN_EXPIRE_SECONDS)
    payload = {**data, "exp": exp, "iat": int(time.time())}
    if _USE_JWT and _pyjwt is not None:
        return _pyjwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    import base64, json
    header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').rstrip(b"=").decode()
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    sig_input = f"{header}.{body}".encode()
    sig = hmac.new(SECRET_KEY.encode(), sig_input, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).rstrip(b"=").decode()
    return f"{header}.{body}.{sig_b64}"


def decode_token(token: str) -> Optional[dict]:
    try:
        if _USE_JWT and _pyjwt is not None:
            return _pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        import base64, json
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, body, sig_b64 = parts
        sig_input = f"{header}.{body}".encode()
        expected_sig = hmac.new(SECRET_KEY.encode(), sig_input, hashlib.sha256).digest()
        expected_b64 = base64.urlsafe_b64encode(expected_sig).rstrip(b"=").decode()
        if not hmac.compare_digest(sig_b64, expected_b64):
            return None
        padded = body + "=" * (4 - len(body) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded))
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


from fastapi import HTTPException, status


def get_current_user(token: str) -> dict:
    from ..models.user import find_user_by_id
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = find_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.get("status") == "suspended":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
    return user


def require_admin(user: dict):
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
