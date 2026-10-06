"""
Base Model and Baseline Abstractions for Class Royale ML Engine
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import numpy as np

from app.schemas.common import ModelMetadata


class BaseMLModel(ABC):
    """
    Abstract contract for all supervised machine learning models.
    Enforces unified prediction, probability calibration, and explainability.
    """

    def __init__(self, model_name: str, model_version: str, algorithm_name: str):
        self.model_name = model_name
        self.model_version = model_version
        self.algorithm_name = algorithm_name
        self.is_trained: bool = False
        self.feature_names: List[str] = []
        self.metadata: Dict[str, Any] = {}

    @abstractmethod
    def fit(self, X: np.ndarray, y: np.ndarray, feature_names: Optional[List[str]] = None) -> "BaseMLModel":
        """Fits the model on training features X and targets y."""
        pass

    @abstractmethod
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Point predictions."""
        pass

    @abstractmethod
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Calibrated probability predictions."""
        pass

    @abstractmethod
    def explain(self, X_sample: np.ndarray) -> Dict[str, Any]:
        """
        Model interpretability breakdown:
        - Tree models expose feature importances
        - Linear models expose feature coefficients
        - Returns structured dictionary of contributing factors
        """
        pass

    def get_metadata(self) -> ModelMetadata:
        """Returns standard metadata for model registry registration."""
        return ModelMetadata(
            model_name=self.model_name,
            model_version=self.model_version,
            algorithm=self.algorithm_name,
            is_trained=self.is_trained,
            validation_metrics=self.metadata.get("validation_metrics", {}),
            hyperparameters=self.metadata.get("hyperparameters", {}),
        )


class BaseBaselineModel(ABC):
    """
    Abstract contract for pedagogical heuristics / baseline rules.
    Used for academic benchmarking (ML vs Baseline) and cold-start fallback.
    """

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def predict(self, *args: Any, **kwargs: Any) -> Any:
        pass
