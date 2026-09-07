from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.translate import router as translate_router
from routes.worksheet import router as worksheet_router

app = FastAPI(title="Vernacular Pedagogy API")

# NOTE: allow_origins is set to "*" (allow all) so that the app running on
# a phone/tablet (Capacitor WebView) can reach this backend during testing.
# allow_credentials must be False when allow_origins is "*" — this is a
# FastAPI/Starlette requirement (the two together are invalid together).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Offline guarantee: POST /translate must never call the public internet.
# The handler in routes/translate.py only runs services.translator, which
# reads data/santali_dictionary.json from disk. Do not import requests,
# httpx, urllib, or any cloud translation client on that path.
app.include_router(translate_router)
app.include_router(worksheet_router)


@app.get("/health")
def health():
    return {"status": "ok"}