"""
Student Mastery Predictor & Baseline Implementation
Estimates student mastery score (0.0 to 1.0) on target engineering topics.
"""

from typing import Any, Dict, List, Optional
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
    RandomForestRegressor,
)

from app.models.base import BaseMLModel, BaseBaselineModel


class MasteryPredictor(BaseMLModel):
    """
    Supervised student topic mastery predictor.
    Supports pluggable candidate algorithms to enable empirical comparison once real datasets arrive.
    """

    CANDIDATE_ALGORITHMS: Dict[str, Any] = {
        "logistic_regression": lambda **kw: LogisticRegression(max_iter=1000, **kw),
        "random_forest": lambda **kw: RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42, **kw),
        "gradient_boosting": lambda **kw: GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42, **kw),
        "hist_gradient_boosting": lambda **kw: HistGradientBoostingClassifier(max_iter=100, random_state=42, **kw),
        "random_forest_regressor": lambda **kw: RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42, **kw),
    }

    def __init__(
        self,
        model_version: str = "v0.1.0",
        algorithm_name: str = "gradient_boosting",
        hyperparameters: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            model_name="mastery_predictor",
            model_version=model_version,
            algorithm_name=algorithm_name,
        )
        self.hyperparameters = hyperparameters or {}
        self.estimator = self._initialize_estimator()

    def _initialize_estimator(self):
        factory = self.CANDIDATE_ALGORITHMS.get(self.algorithm_name)
        if not factory:
            raise ValueError(
                f"Unknown algorithm '{self.algorithm_name}'. "
                f"Supported candidates: {list(self.CANDIDATE_ALGORITHMS.keys())}"
            )
        return factory(**self.hyperparameters)

    def fit(self, X: np.ndarray, y: np.ndarray, feature_names: Optional[List[str]] = None) -> "MasteryPredictor":
        """Fits the underlying candidate model on engineered features."""
        self.feature_names = feature_names or [f"f_{i}" for i in range(X.shape[1])]
        self.estimator.fit(X, y)
        self.is_trained = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_trained:
            raise RuntimeError("Model is not trained. Check is_trained flag before calling predict.")
        return self.estimator.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if not self.is_trained:
            raise RuntimeError("Model is not trained. Check is_trained flag before calling predict_proba.")

        if hasattr(self.estimator, "predict_proba"):
            probs = self.estimator.predict_proba(X)
            # Binary classification: return probability of positive class (mastered)
            return probs[:, 1] if probs.ndim > 1 and probs.shape[1] > 1 else probs
        elif hasattr(self.estimator, "predict"):
            # Regression model: clip prediction to [0.0, 1.0]
            preds = self.estimator.predict(X)
            return np.clip(preds, 0.0, 1.0)
        else:
            raise NotImplementedError("Estimator has neither predict_proba nor predict.")

    def explain(self, X_sample: np.ndarray) -> Dict[str, Any]:
        """Provides interpretability weights / contributing factors."""
        if not self.is_trained:
            return {"status": "NOT_TRAINED", "explanation": "Model artifact is not fitted."}

        contributions: Dict[str, float] = {}
        if hasattr(self.estimator, "feature_importances_"):
            importances = self.estimator.feature_importances_
            for name, imp in zip(self.feature_names, importances):
                contributions[name] = round(float(imp), 4)
        elif hasattr(self.estimator, "coef_"):
            coefs = self.estimator.coef_.ravel()
            for name, c in zip(self.feature_names, coefs):
                contributions[name] = round(float(c), 4)

        # Sort top contributing factors
        sorted_top = sorted(contributions.items(), key=lambda kv: abs(kv[1]), reverse=True)[:5]
        return {
            "algorithm": self.algorithm_name,
            "top_contributing_features": dict(sorted_top),
            "all_features": contributions,
        }


class MasteryBaseline(BaseBaselineModel):
    """
    Classical pedagogical baseline: Smoothed Historical Topic Accuracy.
    Uses Bayesian prior (pseudo-counts: +2 correct, +4 attempts) to prevent wild
    swings on small sample sizes (e.g. 1/1 attempt != 100% mastery).
    """

    def __init__(self, prior_correct: float = 2.0, prior_attempts: float = 4.0):
        super().__init__(name="smoothed_historical_topic_accuracy")
        self.prior_correct = prior_correct
        self.prior_attempts = prior_attempts

    def predict(
        self,
        historical_correct: int,
        historical_attempts: int,
        recent_accuracy: Optional[float] = None
    ) -> float:
        """Calculates smoothed mastery score in range [0.0, 1.0]."""
        smoothed_correct = historical_correct + self.prior_correct
        smoothed_total = historical_attempts + self.prior_attempts
        base_score = smoothed_correct / smoothed_total

        # If recent accuracy is available, apply 70/30 weighting (recency bias)
        if recent_accuracy is not None:
            return round(float(0.7 * recent_accuracy + 0.3 * base_score), 4)

        return round(float(base_score), 4)
