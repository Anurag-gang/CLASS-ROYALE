"""
Question Difficulty Predictor & Baseline Implementation
Estimates student-specific success probability P(correct | question, student context).
"""

from typing import Any, Dict, List, Optional
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

from app.models.base import BaseMLModel, BaseBaselineModel
from app.schemas.common import DifficultyLevel


class QuestionDifficultyPredictor(BaseMLModel):
    """
    Supervised classifier estimating the probability of a student answering a question correctly.
    Lower success probability translates to a more difficult question for that student.
    """

    CANDIDATE_ALGORITHMS: Dict[str, Any] = {
        "logistic_regression": lambda **kw: LogisticRegression(max_iter=1000, **kw),
        "random_forest": lambda **kw: RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42, **kw),
        "gradient_boosting": lambda **kw: GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42, **kw),
    }

    def __init__(
        self,
        model_version: str = "v0.1.0",
        algorithm_name: str = "logistic_regression",
        hyperparameters: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            model_name="question_difficulty_predictor",
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

    def fit(self, X: np.ndarray, y: np.ndarray, feature_names: Optional[List[str]] = None) -> "QuestionDifficultyPredictor":
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
        probs = self.estimator.predict_proba(X)
        return probs[:, 1] if probs.ndim > 1 and probs.shape[1] > 1 else probs

    def predict_difficulty_level(self, success_prob: float) -> DifficultyLevel:
        """Translates probability into pedagogical difficulty level."""
        if success_prob >= 0.75:
            return DifficultyLevel.EASY
        elif success_prob >= 0.40:
            return DifficultyLevel.MEDIUM
        return DifficultyLevel.HARD

    def explain(self, X_sample: np.ndarray) -> Dict[str, Any]:
        if not self.is_trained:
            return {"status": "NOT_TRAINED"}

        contributions: Dict[str, float] = {}
        if hasattr(self.estimator, "coef_"):
            coefs = self.estimator.coef_.ravel()
            for name, c in zip(self.feature_names, coefs):
                contributions[name] = round(float(c), 4)
        elif hasattr(self.estimator, "feature_importances_"):
            for name, imp in zip(self.feature_names, self.estimator.feature_importances_):
                contributions[name] = round(float(imp), 4)

        return {
            "algorithm": self.algorithm_name,
            "feature_contributions": contributions,
        }


class DifficultyBaseline(BaseBaselineModel):
    """
    Classical heuristic baseline: Global Item Accuracy with Student Offset.
    Combines the question's global historical pass rate with the individual student's mastery delta.
    """

    def __init__(self):
        super().__init__(name="global_accuracy_student_offset")

    def predict(
        self,
        global_accuracy: Optional[float] = None,
        student_mastery: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Calculates success probability and derived difficulty level."""
        # Default prior pass rate is 65% for uncalibrated questions
        base_p = global_accuracy if global_accuracy is not None else 0.65

        # If student mastery is provided, adjust probability proportionally
        if student_mastery is not None:
            # Shift probability up or down based on student deviation from median 0.50
            offset = 0.4 * (student_mastery - 0.50)
            p_success = float(np.clip(base_p + offset, 0.05, 0.95))
            is_student_specific = True
        else:
            p_success = float(base_p)
            is_student_specific = False

        if p_success >= 0.75:
            diff_level = DifficultyLevel.EASY
        elif p_success >= 0.40:
            diff_level = DifficultyLevel.MEDIUM
        else:
            diff_level = DifficultyLevel.HARD

        return {
            "success_probability": round(p_success, 4),
            "predicted_difficulty": diff_level,
            "is_student_specific": is_student_specific,
        }
