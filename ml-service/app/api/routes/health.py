"""
Health & Model Catalog API Endpoints
"""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.dependencies import get_model_registry
from app.config.settings import settings
from app.registry.model_registry import ModelRegistry
from app.schemas.common import ModelMetadata

router = APIRouter(tags=["Health & Diagnostics"])


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    ml_mode: str
    demo_mode: bool
    description: str


class ModelsCatalogResponse(BaseModel):
    total_models: int
    models: List[ModelMetadata]


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Service liveness probe and configuration status."""
    return HealthResponse(
        status="healthy",
        service="class-royale-ml-service",
        version=settings.api_version,
        environment=settings.ml_env,
        ml_mode=settings.ml_mode,
        demo_mode=settings.demo_mode,
        description=settings.api_description,
    )


@router.get("/models", response_model=ModelsCatalogResponse)
def list_registered_models(registry: ModelRegistry = Depends(get_model_registry)) -> ModelsCatalogResponse:
    """Lists registered supervised learning models and their real training/readiness status."""
    models = registry.list_models()
    return ModelsCatalogResponse(
        total_models=len(models),
        models=models,
    )
