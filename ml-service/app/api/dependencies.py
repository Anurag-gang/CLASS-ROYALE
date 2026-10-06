"""
FastAPI Dependency Injection Providers
Instantiates and shares singleton registry, loader, predictor, and adaptive engine services.
"""

from functools import lru_cache
from pathlib import Path
from fastapi import Depends

from app.config.settings import settings
from app.registry.model_registry import ModelRegistry
from app.registry.store import JoblibArtifactStore
from app.inference.model_loader import ModelLoader
from app.inference.predictor import MLPredictorService
from app.inference.adaptive_engine import AdaptiveLearningEngine


@lru_cache()
def get_model_registry() -> ModelRegistry:
    registry_dir = settings.resolve_path(settings.model_registry_path)
    store = JoblibArtifactStore(registry_dir)
    return ModelRegistry(registry_dir=registry_dir, store=store)


@lru_cache()
def get_model_loader(registry: ModelRegistry = Depends(get_model_registry)) -> ModelLoader:
    return ModelLoader(registry=registry)


@lru_cache()
def get_predictor_service(loader: ModelLoader = Depends(get_model_loader)) -> MLPredictorService:
    return MLPredictorService(loader=loader)


@lru_cache()
def get_adaptive_engine(predictor: MLPredictorService = Depends(get_predictor_service)) -> AdaptiveLearningEngine:
    return AdaptiveLearningEngine(predictor=predictor)
