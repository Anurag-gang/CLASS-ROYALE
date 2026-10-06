"""
Mastery Model Evaluation Runner
Calculates leak-free test performance metrics (MAE, RMSE, R2, ROC-AUC, Brier).
DO NOT FABRICATE BENCHMARK RESULTS.
"""

from typing import Any, Dict
import numpy as np
from app.models.mastery_predictor import MasteryPredictor
from evaluation.metrics import ClassificationEvaluator, RegressionEvaluator


def evaluate_mastery_model(
    model: MasteryPredictor,
    X_test: np.ndarray,
    y_test: np.ndarray
) -> Dict[str, Any]:
    """Evaluates trained mastery model on unseen student test split."""
    if not model.is_trained:
        return {"status": "MODEL_NOT_TRAINED", "message": "Cannot evaluate an un-trained model artifact."}

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)

    reg_metrics = RegressionEvaluator.evaluate(y_test, y_prob)
    clf_metrics = ClassificationEvaluator.evaluate(y_test, y_pred, y_prob)

    return {
        "model_name": model.model_name,
        "model_version": model.model_version,
        "algorithm": model.algorithm_name,
        "regression_metrics": reg_metrics,
        "classification_metrics": clf_metrics,
    }
