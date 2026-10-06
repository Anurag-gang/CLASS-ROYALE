"""
Class Royale Machine Learning Service - Main FastAPI Application
"""

from contextlib import asynccontextmanager
import logging
import time
import uuid

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config.settings import settings
from app.api.routes import health, mastery, difficulty, topics, recommendation, adaptive

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("class_royale.ml.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        f"Starting Class Royale ML Service [{settings.api_version}] "
        f"in environment='{settings.ml_env}', ml_mode='{settings.ml_mode}', demo_mode={settings.demo_mode}"
    )
    yield
    logger.info("Class Royale ML Service shutdown complete.")


app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Structured Request Telemetry Middleware
@app.middleware("http")
async def audit_telemetry_middleware(request: Request, call_next):
    req_id = str(uuid.uuid4())[:8]
    start_time = time.perf_counter()

    # Safe logging: strictly log endpoint, method, and request ID. Never log request bodies containing PII.
    logger.info(f"[{req_id}] -> {request.method} {request.url.path}")

    try:
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Inference-Time-Ms"] = str(duration_ms)
        logger.info(f"[{req_id}] <- {response.status_code} ({duration_ms}ms)")
        return response
    except Exception as exc:
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(f"[{req_id}] Exception during {request.method} {request.url.path} ({duration_ms}ms): {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "ERROR",
                "request_id": req_id,
                "message": "An internal ML inference error occurred. Check server logs.",
            },
        )


# Global Exception Handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "ERROR",
            "message": "Internal service error. Internal stack traces are withheld for security.",
        },
    )


# Mount REST Endpoints
app.include_router(health.router)
app.include_router(mastery.router)
app.include_router(difficulty.router)
app.include_router(topics.router)
app.include_router(recommendation.router)
app.include_router(adaptive.router)


@app.get("/", tags=["Root"])
def root_redirect():
    """Service landing descriptor and link to interactive API documentation."""
    return {
        "service": "Class Royale Machine Learning Service",
        "documentation": "/docs",
        "alternative_docs": "/redoc",
        "health": "/health",
        "models_catalog": "/models",
        "version": settings.api_version,
        "mode": settings.ml_mode,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
    )
