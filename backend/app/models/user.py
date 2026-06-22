import re
import time
import uuid
from ..db import get_db


def users_collection():
    return get_db()["users"]


def audit_logs_collection():
    return get_db()["audit_logs"]


def reset_tokens_collection():
    return get_db()["reset_tokens"]


def create_user(full_name: str, organization: str, email: str, password_hash: str, role: str = "researcher") -> dict:
    doc = {
        "id": str(uuid.uuid4()),
        "full_name": full_name,
        "organization": organization,
        "email": email.lower().strip(),
        "password_hash": password_hash,
        "role": role,
        "status": "active",
        "created_at": time.time(),
    }
    users_collection().insert_one({**doc, "_id": doc["id"]})
    return doc


def find_user_by_email(email: str):
    doc = users_collection().find_one({"email": email.lower().strip()})
    if doc:
        doc.pop("_id", None)
    return doc


def find_user_by_id(user_id: str):
    doc = users_collection().find_one({"id": user_id})
    if doc:
        doc.pop("_id", None)
    return doc


def list_users(skip: int = 0, limit: int = 50, search: str = "") -> list:
    query = {}
    if search:
        pattern = re.compile(re.escape(search), re.IGNORECASE)
        query = {"$or": [{"full_name": pattern}, {"email": pattern}]}
    docs = list(users_collection().find(query, {"_id": 0}).skip(skip).limit(limit))
    for d in docs:
        d.pop("password_hash", None)
    return docs


def count_users(search: str = "") -> int:
    if search:
        pattern = re.compile(re.escape(search), re.IGNORECASE)
        return users_collection().count_documents({"$or": [{"full_name": pattern}, {"email": pattern}]})
    return users_collection().count_documents({})


def update_user(user_id: str, updates: dict):
    updates.pop("_id", None)
    updates.pop("id", None)
    updates.pop("password_hash", None)
    users_collection().update_one({"id": user_id}, {"$set": updates})
    return find_user_by_id(user_id)


def update_user_password(user_id: str, password_hash: str):
    users_collection().update_one({"id": user_id}, {"$set": {"password_hash": password_hash}})


def delete_user(user_id: str) -> bool:
    result = users_collection().delete_one({"id": user_id})
    return result.deleted_count > 0


def create_audit_log(user_id: str, action: str, resource: str = "", ip: str = "") -> dict:
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": action,
        "resource": resource,
        "ip": ip,
        "timestamp": time.time(),
    }
    audit_logs_collection().insert_one({**doc, "_id": doc["id"]})
    return doc


def list_audit_logs(skip: int = 0, limit: int = 100) -> list:
    return list(audit_logs_collection().find({}, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit))


def save_reset_token(email: str, token: str, expires_at: float):
    reset_tokens_collection().update_one(
        {"email": email},
        {"$set": {"token": token, "expires_at": expires_at}},
        upsert=True,
    )


def find_reset_token(token: str):
    doc = reset_tokens_collection().find_one({"token": token})
    if doc:
        doc.pop("_id", None)
    return doc


def delete_reset_token(token: str):
    reset_tokens_collection().delete_one({"token": token})
