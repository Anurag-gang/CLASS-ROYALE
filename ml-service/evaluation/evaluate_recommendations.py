"""
Recommendation Evaluation Runner
Calculates Precision@K, Recall@K, and MRR.
"""

from typing import Any, Dict, List
from evaluation.metrics import RecommendationEvaluator


def evaluate_recommendations(
    recommended_lists: List[List[str]],
    relevant_lists: List[List[str]],
    k: int = 3
) -> Dict[str, Any]:
    p_at_k = [
        RecommendationEvaluator.precision_at_k(rec, rel, k)
        for rec, rel in zip(recommended_lists, relevant_lists)
    ]
    r_at_k = [
        RecommendationEvaluator.recall_at_k(rec, rel, k)
        for rec, rel in zip(recommended_lists, relevant_lists)
    ]
    mrr = RecommendationEvaluator.mean_reciprocal_rank(recommended_lists, relevant_lists)

    return {
        f"precision@{k}": float(sum(p_at_k) / max(1, len(p_at_k))),
        f"recall@{k}": float(sum(r_at_k) / max(1, len(r_at_k))),
        "mrr": float(mrr),
    }
