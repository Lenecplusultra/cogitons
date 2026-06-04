from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.core.config import settings

app = FastAPI(
    title="Cogitons API",
    description="Subject-centered knowledge and discussion platform for Cameroonian students and young professionals.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS — allow the Next.js frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,  # Required for HTTP-only cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(health_router, prefix=API_PREFIX, tags=["health"])

# Phase 1+ routers will be added here as they are built:
# from app.api.auth import router as auth_router
# app.include_router(auth_router, prefix=API_PREFIX, tags=["auth"])
# ...


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"message": "Cogitons API is running. See /api/docs for documentation."}
