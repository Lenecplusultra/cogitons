from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.discussions import router as discussions_router
from app.api.feed import router as feed_router
from app.api.health import router as health_router
from app.api.moderation import router as moderation_router
from app.api.responses import router as responses_router
from app.api.search import router as search_router
from app.api.stats import router as stats_router
from app.api.subjects import router as subjects_router
from app.api.users import router as users_router
from app.api.votes import router as votes_router
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

app.include_router(auth_router, prefix=API_PREFIX, tags=["auth"])

app.include_router(discussions_router, prefix=API_PREFIX, tags=["discussions"])

app.include_router(feed_router, prefix=API_PREFIX, tags=["feed"])

app.include_router(moderation_router, prefix=API_PREFIX, tags=["moderation"])

app.include_router(responses_router, prefix=API_PREFIX, tags=["responses"])

app.include_router(search_router, prefix=API_PREFIX, tags=["search"])

app.include_router(stats_router, prefix=API_PREFIX, tags=["stats"])

app.include_router(subjects_router, prefix=API_PREFIX, tags=["subjects"])

app.include_router(users_router, prefix=API_PREFIX, tags=["users"])

app.include_router(votes_router, prefix=API_PREFIX, tags=["votes"])


# Phase 1+ routers will be added here as they are built:
# from app.api.auth import router as auth_router
# app.include_router(auth_router, prefix=API_PREFIX, tags=["auth"])
# ...


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"message": "Cogitons API is running. See /api/docs for documentation."}
