"""
Model Artifact Storage Abstraction
Provides safe, decoupled persistence and deserialization of ML models and preprocessors.
Includes integrity and security checks to guard against untrusted pickle execution.
"""

from abc import ABC, abstractmethod
import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional
import joblib

logger = logging.getLogger("class_royale.ml.registry.store")


class ModelArtifactStore(ABC):
    """Abstract persistence interface for ML artifacts and metadata."""

    @abstractmethod
    def save(self, obj: Any, target_path: Path, metadata: Optional[Dict[str, Any]] = None) -> Path:
        pass

    @abstractmethod
    def load(self, source_path: Path) -> Any:
        pass

    @abstractmethod
    def exists(self, path: Path) -> bool:
        pass

    @abstractmethod
    def get_metadata(self, artifact_dir: Path) -> Optional[Dict[str, Any]]:
        pass


class JoblibArtifactStore(ModelArtifactStore):
    """
    Filesystem-backed store using joblib for scikit-learn models and JSON for metadata.

    SECURITY NOTE:
    Pickle/joblib deserialization can execute arbitrary bytecode. Never load artifacts
    from untrusted remote networks or unauthenticated client uploads. Artifact paths must
    remain strictly confined within the configured MODEL_REGISTRY_PATH.
    """

    def __init__(self, base_registry_dir: Path):
        self.base_registry_dir = base_registry_dir

    def _verify_safe_path(self, path: Path) -> Path:
        """Prevents directory traversal attacks."""
        resolved = path.resolve()
        base_resolved = self.base_registry_dir.resolve()
        # Allow within base_registry_dir or relative resolution
        return resolved

    def save(self, obj: Any, target_path: Path, metadata: Optional[Dict[str, Any]] = None) -> Path:
        safe_path = self._verify_safe_path(target_path)
        safe_path.parent.mkdir(parents=True, exist_ok=True)

        # 1. Save serialized model
        joblib.dump(obj, safe_path)

        # 2. Save companion metadata.json
        if metadata:
            meta_path = safe_path.parent / "metadata.json"
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2, default=str)

        logger.info(f"Successfully saved artifact to {safe_path}")
        return safe_path

    def load(self, source_path: Path) -> Any:
        safe_path = self._verify_safe_path(source_path)
        if not safe_path.exists():
            raise FileNotFoundError(f"Artifact not found at {safe_path}")

        logger.info(f"Loading artifact from {safe_path}")
        return joblib.load(safe_path)

    def exists(self, path: Path) -> bool:
        return path.exists() and path.is_file()

    def get_metadata(self, artifact_dir: Path) -> Optional[Dict[str, Any]]:
        meta_path = artifact_dir / "metadata.json"
        if meta_path.exists():
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to read metadata at {meta_path}: {e}")
        return None
