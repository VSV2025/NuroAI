# app/store.py — data access, now backed by MongoDB.
# The function names are identical to the in-memory version, so nothing else
# in the app had to change. We use the document's own uuid as Mongo's _id and
# hide _id on reads (we keep a separate "id" field for the API responses).

from .db import documents_collection, settings_collection

_SETTINGS_ID = "app_settings"

DEFAULT_SETTINGS: dict = {
    "semanticIntelligence":    True,
    "aiLaunderingDetection":   True,
    "crossLanguageDetection":  True,
    "authorshipVerification":  True,
    "codeIntelligence":        False,
    "autoQuarantine":          False,
    "riskThreshold":           60,
}


def save_document(doc):
    record = dict(doc)
    record["_id"] = record["id"]               # use our uuid as the primary key
    documents_collection().replace_one({"_id": record["_id"]}, record, upsert=True)
    return doc


def get_document(doc_id):
    return documents_collection().find_one({"_id": doc_id}, {"_id": 0})


def update_document(doc_id, patch):
    documents_collection().update_one({"_id": doc_id}, {"$set": patch})
    return get_document(doc_id)


def list_documents():
    return list(documents_collection().find({}, {"_id": 0}))


def get_settings() -> dict:
    doc = settings_collection().find_one({"_id": _SETTINGS_ID}, {"_id": 0})
    if not doc:
        return dict(DEFAULT_SETTINGS)
    result = dict(DEFAULT_SETTINGS)
    result.update({k: v for k, v in doc.items() if k in DEFAULT_SETTINGS})
    return result


def save_settings(patch: dict) -> dict:
    safe = {k: v for k, v in patch.items() if k in DEFAULT_SETTINGS}
    if safe:
        settings_collection().update_one(
            {"_id": _SETTINGS_ID},
            {"$set": safe},
            upsert=True,
        )
    return get_settings()
