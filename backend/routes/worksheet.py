from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.worksheet import generate_worksheet, list_categories


router = APIRouter()


class WorksheetRequest(BaseModel):
    category: str


@router.get("/worksheet/categories")
def get_categories():
    return {"categories": list_categories()}


@router.post("/worksheet")
def create_worksheet(payload: WorksheetRequest):
    try:
        result = generate_worksheet(payload.category)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return result