# app/routers/settings.py — persist detection layer toggles in MongoDB
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SettingsIn(BaseModel):
    semanticIntelligence:   Optional[bool] = None
    aiLaunderingDetection:  Optional[bool] = None
    crossLanguageDetection: Optional[bool] = None
    authorshipVerification: Optional[bool] = None
    codeIntelligence:       Optional[bool] = None
    autoQuarantine:         Optional[bool] = None
    riskThreshold:          Optional[int]  = None


@router.get("")
def get_settings_endpoint():
    from ..store import get_settings
    return get_settings()


@router.post("")
def save_settings_endpoint(body: SettingsIn):
    from ..store import save_settings
    patch = {k: v for k, v in body.dict().items() if v is not None}
    return save_settings(patch)
