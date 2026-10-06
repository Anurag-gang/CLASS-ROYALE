"""
Evaluation Metrics Framework for Class Royale Educational ML
Encompasses Classification, Regression, Probability Calibration, and Ranking Metrics.
DO NOT REPORT FAKE METRICS BEFORE TRAINING ON REAL DATASETS.
"""

from typing import Any, Dict, List, Optional
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    log_loss,
    brier_score_loss,
    mean_absolute_error,
    root_mean_squared_error,
    r2_score,
    confusion_matrix,
)


class ClassificationEvaluator:
    """Evaluates discrete classification models (e.g. WeakTopicClassifier, binary pass/fail)."""

    @staticmethod
    def evaluate(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prob: Optional[np.ndarray] = None,
        average: str = "macro",
    ) -> Dict[str, Any]:
        results = {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision": float(precision_score(y_true, y_pred, average=average, zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, average=average, zero_division=0)),
            "f1_score": float(f1_score(y_true, y_pred, average=average, zero_division=0)),
            "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
        }

        # Calculate ROC-AUC if probabilities are available
        if y_prob is not None:
            try:
                if y_prob.ndim == 1 or y_prob.shape[1] == 2:
                    pos_prob = y_prob[:, 1] if y_prob.ndim > 1 else y_prob
                    results["roc_auc"] = float(roc_auc_score(y_true, pos_prob))
                    results["log_loss"] = float(log_loss(y_true, pos_prob))
                else:
                    results["roc_auc"] = float(roc_auc_score(y_true, y_prob, multi_class="ovr"))
            except Exception:
                pass

        return results


class RegressionEvaluator:
    """Evaluates continuous regression models (e.g. continuous student mastery score)."""

    @staticmethod
    def evaluate(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        return {
            "mae": float(mean_absolute_error(y_true, y_pred)),
            "rmse": float(root_mean_squared_error(y_true, y_pred)),
            "r2_score": float(r2_score(y_true, y_pred)),
        }


class ProbabilityCalibrationEvaluator:
    """Evaluates probabilistic confidence calibration (e.g. QuestionDifficultyPredictor)."""

    @staticmethod
    def evaluate(y_true: np.ndarray, y_prob: np.ndarray) -> Dict[str, float]:
        clipped_prob = np.clip(y_prob, 1e-6, 1.0 - 1e-6)
        return {
            "brier_score": float(brier_score_loss(y_true, y_prob)),
            "log_loss": float(log_loss(y_true, clipped_prob)),
        }


class RecommendationEvaluator:
    """Evaluates question recommendation rankings (Precision@K, Recall@K, MRR, NDCG@K)."""

    @staticmethod
    def precision_at_k(recommended: List[str], relevant: List[str], k: int) -> float:
        if k <= 0 or not recommended:
            return 0.0
        rec_k = recommended[:k]
        rel_set = set(relevant)
        hits = sum(1 for q in rec_k if q in rel_set)
        return float(hits / k)

    @staticmethod
    def recall_at_k(recommended: List[str], relevant: List[str], k: int) -> float:
        if not relevant:
            return 0.0
        rec_k = recommended[:k]
        rel_set = set(relevant)
        hits = sum(1 for q in rec_k if q in rel_set)
        return float(hits / len(rel_set))

    @staticmethod
    def mean_reciprocal_rank(recommended_lists: List[List[str]], relevant_lists: List[List[str]]) -> float:
        reciprocal_ranks = []
        for rec, rel in zip(recommended_lists, relevant_lists):
            rel_set = set(rel)
            rr = 0.0
            for rank_idx, item in enumerate(rec, start=1):
                if item in rel_set:
                    rr = 1.0 / rank_idx
                    break
            reciprocal_ranks.append(rr)
        return float(np.mean(reciprocal_ranks)) if reciprocal_ranks else 0.0

    @staticmethod
    def ndcg_at_k(recommended: List[str], relevant_ratings: Dict[str, float], k: int) -> float:
        """Normalized Discounted Cumulative Gain at rank K."""
        rec_k = recommended[:k]
        dcg = 0.0
        for i, item in enumerate(rec_k, start=1):
            rel = relevant_ratings.get(item, 0.0)
            dcg += (2.0 ** rel - 1.0) / np.log2(i + 1)

        # Ideal DCG
        ideal_rels = sorted(relevant_ratings.values(), reverse=True)[:k]
        idcg = sum((2.0 ** rel - 1.0) / np.log2(i + 1) for i, rel in enumerate(ideal_rels, start=1))

        if idcg == 0.0:
            return 0.0
        return float(dcg / idcg)
