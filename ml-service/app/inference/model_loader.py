"""
Thread-Safe Model Loader and In-Memory Cache
Safely retrieves and holds model instances from disk using ModelRegistry and ModelArtifactStore.
"""

import logging
from pathlib import Path
from typing import Any, Dict, Optional

from app.registry.model_registry import ModelRegistry
from app.registry.store import ModelArtifactStore, JoblibArtifactStore

logger = logging.getLogger("class_royale.ml.inference.loader")


class ModelLoader:
    """
    Caches model instances in memory to eliminate filesystem I/O latency during hot inference paths.
    Returns None if a model artifact has not yet been trained or does not exist.
    """

    def __init__(self, registry: ModelRegistry, store: Optional[ModelArtifactStore] = None):
        self.registry = registry
        self.store = store or JoblibArtifactStore(registry.registry_dir)
        self._cache: Dict[str, Any] = {}

    def get_cache_key(self, model_name: str, version: str) -> str:
        return f"{model_name}:{version}"

    def load_model(self, model_name: str, version: str) -> Optional[Any]:
        """
        Loads model object. Returns None safely if model artifact is not available.
        Does NOT raise unexpected exceptions during un-trained/placeholder stages.
        """
        key = self.get_cache_key(model_name, version)
        if key in self._cache:
            return self._cache[key]

        artifact_path = self.registry.get_artifact_path(model_name, version)
        if not self.store.exists(artifact_path):
            logger.debug(f"Model artifact {key} does not exist at {artifact_path}. Safe fallback.")
            return None

        try:
            model_obj = self.store.load(artifact_path)
            self._cache[key] = model_obj
            logger.info(f"Loaded and cached model {key}")
            return model_obj
        except Exception as e:
            logger.error(f"Error loading model artifact {key}: {e}", exc_info=True)
            return None

    def clear_cache(self, model_name: Optional[str] = None):
        """Clears specific model or entire in-memory cache."""
        if model_name:
            keys_to_del = [k for k in self._cache if k.startswith(f"{model_name}:")]
            for k in keys_to_del:
                del self._cache[k]
        else:
            self._cache.clear()
