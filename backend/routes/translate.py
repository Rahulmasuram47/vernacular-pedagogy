from fastapi import APIRouter
from pydantic import BaseModel

from services.translator import translate as run_translate


router = APIRouter()


class TranslateRequest(BaseModel):
    text: str


@router.post("/translate")
def translate(payload: TranslateRequest):
    result = run_translate(payload.text)
    return {
        "hindi": result["hindi"],
        "santali": result["santali"],
        "confidence": result["confidence"],
        "language": "santali",
    }
