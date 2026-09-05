from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter()


class WorksheetRequest(BaseModel):
    hindi: str = ""
    santali: str = ""


@router.post("/worksheet")
def worksheet(payload: WorksheetRequest):
    """Stub: return a placeholder bilingual worksheet payload."""
    return {
        "title": "द्विभाषी कार्यपत्रक",
        "hindi": payload.hindi,
        "santali": payload.santali,
        "items": [],
        "stub": True,
    }
