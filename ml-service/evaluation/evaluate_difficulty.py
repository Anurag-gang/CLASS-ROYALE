"""
Question Difficulty Evaluation Runner
Calculates Brier Score and Log Loss on test students.
"""

from typing import Any, Dict
import numpy as np
from app.models.difficulty_predictor import QuestionDifficultyPredictor
from evaluation.metrics import ProbabilityCalibrationEvaluator, ClassificationEvaluator


def evaluate_difficulty_model(
    model: QuestionDifficultyPredictor,
    X_test: np.ndarray,
    y_test: np.ndarray
) -> Dict[str, Any]:
    if not model.is_trained:
        return {"status": "MODEL_NOT_TRAINED"}

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)

    calib_metrics = ProbabilityCalibrationEvaluator.evaluate(y_test, y_prob)
    clf_metrics = ClassificationEvaluator.evaluate(y_test, y_pred, y_prob)

    return {
        "model_name": model.model_name,
        "calibration": calib_metrics,
        "classification": clf_metrics,
    }
