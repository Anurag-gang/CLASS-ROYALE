"""
Weak Topic Classifier & Baseline Implementation
Identifies engineering topics requiring pedagogical intervention (STRONG, NORMAL, WEAK).
"""

from typing import Any, Dict, List, Optional
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

from app.models.base import BaseMLModel, BaseBaselineModel
from app.schemas.common import TopicStatus


class WeakTopicClassifier(BaseMLModel):
    """
    Supervised 3-class classifier (STRONG / NORMAL / WEAK).
    Detects knowledge gaps and conceptual decay across syllabus topics.
    """

    CLASS_LABELS: List[TopicStatus] = [TopicStatus.WEAK, TopicStatus.NORMAL, TopicStatus.STRONG]

    CANDIDATE_ALGORITHMS: Dict[str, Any] = {
        "logistic_regression": lambda **kw: LogisticRegression(max_iter=1000, **kw),
        "random_forest": lambda **kw: RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42, **kw),
        "gradient_boosting": lambda **kw: GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42, **kw),
    }

    def __init__(
        self,
        model_version: str = "v0.1.0",
        algorithm_name: str = "random_forest",
        hyperparameters: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            model_name="weak_topic_classifier",
            model_version=model_version,
            algorithm_name=algorithm_name,
        )
        self.hyperparameters = hyperparameters or {}
        self.estimator = self._initialize_estimator()

    def _initialize_estimator(self):
        factory = self.CANDIDATE_ALGORITHMS.get(self.algorithm_name)
        if not factory:
            raise ValueError(f"Unknown algorithm '{self.algorithm_name}'")
        return factory(**self.hyperparameters)

    def fit(self, X: np.ndarray, y: np.ndarray, feature_names: Optional[List[str]] = None) -> "WeakTopicClassifier":
        self.feature_names = feature_names or [f"f_{i}" for i in range(X.shape[1])]
        self.estimator.fit(X, y)
        self.is_trained = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_trained:
            raise RuntimeError("Model is not trained.")
        return self.estimator.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if not self.is_trained:
            raise RuntimeError("Model is not trained.")
        return self.estimator.predict_proba(X)

    def explain(self, X_sample: np.ndarray) -> Dict[str, Any]:
        if not self.is_trained:
            return {"status": "NOT_TRAINED"}

        contributions: Dict[str, float] = {}
        if hasattr(self.estimator, "feature_importances_"):
            for name, imp in zip(self.feature_names, self.estimator.feature_importances_):
                contributions[name] = round(float(imp), 4)

        return {
            "algorithm": self.algorithm_name,
            "feature_contributions": contributions,
        }


class WeakTopicBaseline(BaseBaselineModel):
    """
    Classical rule-based pedagogical baseline.
    Evaluates topic accuracy, attempt volume, and consecutive failures against syllabus thresholds.
    """

    def __init__(
        self,
        weak_threshold: float = 0.50,
        strong_threshold: float = 0.75,
        min_attempts_for_strong: int = 5,
    ):
        super().__init__(name="threshold_accuracy_streak_baseline")
        self.weak_threshold = weak_threshold
        self.strong_threshold = strong_threshold
        self.min_attempts_for_strong = min_attempts_for_strong

    def predict(
        self,
        topic_accuracy: float,
        recent_topic_accuracy: Optional[float] = None,
        total_attempts: int = 0,
        consecutive_wrong: int = 0,
    ) -> Dict[str, Any]:
        """Classifies topic and provides pedagogical rationale."""
        # Use recent accuracy if available (70% weight)
        effective_acc = (
            0.7 * recent_topic_accuracy + 0.3 * topic_accuracy
            if recent_topic_accuracy is not None
            else topic_accuracy
        )

        reasons: List[str] = []

        # Urgent flag: multiple consecutive failures indicates acute confusion
        if consecutive_wrong >= 3:
            status = TopicStatus.WEAK
            confidence = min(0.95, 0.70 + 0.05 * consecutive_wrong)
            reasons.append(f"Student has {consecutive_wrong} consecutive wrong attempts on this concept.")
            intervention_recommended = True
        elif effective_acc < self.weak_threshold:
            status = TopicStatus.WEAK
            confidence = 0.88
            reasons.append(f"Effective topic accuracy ({effective_acc:.1%}) is below mastery threshold ({self.weak_threshold:.1%}).")
            intervention_recommended = True
        elif effective_acc >= self.strong_threshold and total_attempts >= self.min_attempts_for_strong:
            status = TopicStatus.STRONG
            confidence = 0.90
            reasons.append(f"Strong demonstrated mastery ({effective_acc:.1%}) across {total_attempts} completed questions.")
            intervention_recommended = False
        else:
            status = TopicStatus.NORMAL
            confidence = 0.80
            reasons.append(f"Performance ({effective_acc:.1%}) is within expected baseline progression.")
            intervention_recommended = False

        return {
            "status": status,
            "confidence": round(confidence, 4),
            "effective_accuracy": round(effective_acc, 4),
            "intervention_recommended": intervention_recommended,
            "reasons": reasons,
        }
