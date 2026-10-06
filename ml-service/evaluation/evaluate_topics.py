"""
Weak Topic Evaluation Runner
"""

from typing import Any, Dict
import numpy as np
from app.models.weak_topic_classifier import WeakTopicClassifier
from evaluation.metrics import ClassificationEvaluator


def evaluate_topic_model(
    model: WeakTopicClassifier,
    X_test: np.ndarray,
    y_test: np.ndarray
) -> Dict[str, Any]:
    if not model.is_trained:
        return {"status": "MODEL_NOT_TRAINED"}

    y_pred = model.predict(X_test)
    clf_metrics = ClassificationEvaluator.evaluate(y_test, y_pred)

    return {
        "model_name": model.model_name,
        "classification": clf_metrics,
    }
