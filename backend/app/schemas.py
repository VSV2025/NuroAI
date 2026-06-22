# app/schemas.py — request body shapes (FastAPI validates these automatically)
from pydantic import BaseModel
from typing import Optional


class TextIn(BaseModel):
    text: str
    filename: Optional[str] = None


class AuthorshipIn(BaseModel):
    submission: str
    baseline: Optional[str] = ""


class CrossLangIn(BaseModel):
    text: str = ""


class CodeIn(BaseModel):
    left: str
    right: str
