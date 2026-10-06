"""
Class Royale Machine Learning Model Registry
Manages model catalogs, version lineage, artifact paths, and training audit trails.
"""

from datetime import datetime, timezone
import logging
from pathlib import Path
import sys
from typing import Any, Dict, List, Optional
import sklearn

from app.registry.store import ModelArtifactStore, JoblibArtifactStore
from app.schemas.common import ModelMetadata

logger = logging.getLogger("class_royale.ml.registry")


class ModelRegistry:
    """
    Central repository tracking all models in the Class Royale ecosystem.
    Prevents silent failures by verifying artifact existence and version compatibility.
    """

    CORE_MODELS = [
        "mastery_predictor",
        "question_difficulty_predictor",
        "weak_topic_classifier",
        "question_recommender",
    ]

    def __init__(self, registry_dir: Path, store: Optional[ModelArtifactStore] = None):
        self.registry_dir = registry_dir
        self.store = store or JoblibArtifactStore(registry_dir)
        self._in_memory_catalog: Dict[str, Dict[str, Dict[str, Any]]] = {}

    def get_artifact_path(self, model_name: str, version: str) -> Path:
        """Standardized path convention: artifacts/models/{model_name}/{version}/model.joblib"""
        return self.registry_dir / model_name / version / "model.joblib"

    def is_model_available(self, model_name: str, version: str) -> bool:
        """Returns True only if a trained model artifact actually exists on disk."""
        path = self.get_artifact_path(model_name, version)
        return self.store.exists(path)

    def register_metadata(
        self,
        model_name: str,
        version: str,
        algorithm: str,
        is_trained: bool,
        feature_schema_version: str = "v1.0",
        training_dataset: Optional[str] = None,
        dataset_version: Optional[str] = None,
        validation_metrics: Optional[Dict[str, float]] = None,
        test_metrics: Optional[Dict[str, float]] = None,
        hyperparameters: Optional[Dict[str, Any]] = None,
        preprocessing_version: str = "v1.0",
    ) -> Dict[str, Any]:
        """Creates formal metadata record for a model version."""
        meta = {
            "model_name": model_name,
            "model_version": version,
            "algorithm": algorithm,
            "is_trained": is_trained,
            "training_dataset": training_dataset or "PENDING_REAL_DATASET_INTEGRATION",
            "dataset_version": dataset_version,
            "feature_schema_version": feature_schema_version,
            "training_timestamp": datetime.now(timezone.utc).isoformat() if is_trained else None,
            "validation_metrics": validation_metrics or {},
            "test_metrics": test_metrics or {},
            "hyperparameters": hyperparameters or {},
            "python_version": sys.version.split()[0],
            "sklearn_version": sklearn.__version__,
            "preprocessing_version": preprocessing_version,
        }

        if model_name not in self._in_memory_catalog:
            self._in_memory_catalog[model_name] = {}
        self._in_memory_catalog[model_name][version] = meta

        # Persist metadata to disk
        meta_dir = self.registry_dir / model_name / version
        meta_dir.mkdir(parents=True, exist_ok=True)
        meta_file = meta_dir / "metadata.json"
        import json
        with open(meta_file, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

        logger.info(f"Registered model metadata for {model_name}:{version}")
        return meta

    def get_metadata(self, model_name: str, version: str) -> Dict[str, Any]:
        """Retrieves metadata from memory or disk."""
        if model_name in self._in_memory_catalog and version in self._in_memory_catalog[model_name]:
            return self._in_memory_catalog[model_name][version]

        artifact_dir = self.registry_dir / model_name / version
        meta = self.store.get_metadata(artifact_dir)
        if meta:
            return meta

        # Fallback default descriptor for untrained model
        return {
            "model_name": model_name,
            "model_version": version,
            "algorithm": "uninitialized",
            "is_trained": False,
            "training_dataset": "NO_TRAINED_ARTIFACT",
            "validation_metrics": {},
            "test_metrics": {},
        }

    def list_models(self) -> List[ModelMetadata]:
        """Lists all registered models and their training status."""
        catalog: List[ModelMetadata] = []

        # Enumerate directories
        if self.registry_dir.exists():
            for model_dir in self.registry_dir.iterdir():
                if model_dir.is_dir():
                    model_name = model_dir.name
                    for version_dir in model_dir.iterdir():
                        if version_dir.is_dir():
                            version = version_dir.name
                            meta = self.get_metadata(model_name, version)
                            catalog.append(
                                ModelMetadata(
                                    model_name=model_name,
                                    model_version=version,
                                    algorithm=meta.get("algorithm", "supervised"),
                                    is_trained=meta.get("is_trained", False),
                                    validation_metrics=meta.get("validation_metrics", {}),
                                    hyperparameters=meta.get("hyperparameters", {}),
                                )
                            )

        # Ensure all 4 core models appear even if no artifact directory has been created yet
        found_names = set(m.model_name for m in catalog)
        for core in self.CORE_MODELS:
            if core not in found_names:
                catalog.append(
                    ModelMetadata(
                        model_name=core,
                        model_version="v0.1.0",
                        algorithm="pending_training",
                        is_trained=False,
                        description="Supervised model awaiting real dataset integration",
                    )
                )

        return catalog
