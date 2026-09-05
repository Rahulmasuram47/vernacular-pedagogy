from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.translate import router as translate_router
from routes.worksheet import router as worksheet_router

app = FastAPI(title="Vernacular Pedagogy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(translate_router)
app.include_router(worksheet_router)


@app.get("/health")
def health():
    return {"status": "ok"}
