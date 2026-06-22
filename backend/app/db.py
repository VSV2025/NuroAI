# app/db.py — MongoDB connection
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()  # read MONGODB_URI / MONGODB_DB from a .env file if present

_client = None


def get_client():
    """Lazily create a single shared MongoClient."""
    global _client
    if _client is None:
        uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
        # serverSelectionTimeoutMS keeps us from hanging forever if Mongo is down
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    return _client


def get_db():
    name = os.environ.get("MONGODB_DB", "nuroai")
    return get_client()[name]


def documents_collection():
    return get_db()["documents"]


def settings_collection():
    return get_db()["settings"]


def author_profiles_collection():
    return get_db()["author_profiles"]


def ping():
    """Raises if the database is unreachable."""
    get_client().admin.command("ping")
