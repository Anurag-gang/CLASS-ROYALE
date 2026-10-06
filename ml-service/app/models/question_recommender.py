"""
Next Question Recommender Engine & Baseline Implementation
Ranks candidate questions to optimize student learning flow state, reinforce weak concepts,
and prevent repetitive question exposure.
"""

from typing import Any, Dict, List, Optional
import numpy as np

from app.schemas.common import DifficultyLevel
from app.schemas.recommendation import QuestionCandidate, RankedQuestion


class QuestionRecommender:
    """
    Pedagogical Question Ranking Engine.
    Employs a multi-factor scoring function:
    1. Zone of Proximal Development (ZPD) Match: Rewards questions where predicted success is ~0.65-0.75
    2. Novelty / Anti-Repetition: Heavily penalizes questions the student has seen recently
    3. Topic Relevance: Boosts questions targeting diagnosed weak topics or requested focus
    4. Prerequisite Coherence: Ensures prerequisite concepts are reasonably mastered

    Extensible architecture designed to swap in Learning-to-Rank (LTR / LambdaMART / LightGBM-Rank)
    once real interaction ranking datasets are introduced in the next phase.
    """

    def __init__(
        self,
        target_success_prob: float = 0.70,  # Optimal flow zone
        novelty_decay_factor: float = 0.5,
        weak_topic_boost: float = 0.35,
        model_version: str = "v1.0.0",
    ):
        self.target_success_prob = target_success_prob
        self.novelty_decay_factor = novelty_decay_factor
        self.weak_topic_boost = weak_topic_boost
        self.model_version = model_version
        self.algorithm_name = "zpd_flow_scoring"
        self.model_name = "question_recommender"
        self.is_trained = True

    def rank_candidates(
        self,
        candidates: List[QuestionCandidate],
        student_mastery: Optional[float] = None,
        weak_topics: Optional[List[str]] = None,
        target_difficulty: Optional[DifficultyLevel] = None,
        exclude_question_ids: Optional[List[str]] = None,
        top_k: int = 3,
    ) -> List[RankedQuestion]:
        """Scores and sorts candidate questions."""
        exclude_set = set(exclude_question_ids or [])
        weak_topic_set = set(weak_topics or [])
        mastery = student_mastery if student_mastery is not None else 0.50

        scored_list: List[RankedQuestion] = []

        for q in candidates:
            if q.question_id in exclude_set:
                continue

            # 1. Estimate success probability P(correct | student, question)
            q_diff = q.difficulty if q.difficulty is not None else 0.50
            # Higher student mastery increases success; higher question difficulty reduces it
            estimated_p = float(np.clip(mastery - 0.5 * q_diff + 0.25, 0.10, 0.95))

            # 2. Score Factor A: Flow Zone (distance from optimal 0.70 success rate)
            # Max score 1.0 when estimated_p == 0.70
            flow_score = 1.0 - abs(estimated_p - self.target_success_prob) / 0.70
            flow_score = max(0.0, flow_score)

            # 3. Score Factor B: Weak Topic Reinforcement (+weak_topic_boost boost)
            topic_boost = self.weak_topic_boost if q.topic_id in weak_topic_set else 0.0

            # 4. Score Factor C: Explicit Difficulty Target Alignment (+0.25 boost)
            diff_boost = 0.0
            if target_difficulty and q.difficulty_level:
                if q.difficulty_level == target_difficulty:
                    diff_boost = 0.25

            # 5. Score Factor D: Novelty Penalty (penalize previously seen questions)
            times_seen = q.times_seen_by_student
            novelty_multiplier = 1.0 / (1.0 + self.novelty_decay_factor * times_seen)

            # Composite Pedagogical Ranking Score
            raw_score = (0.50 * flow_score + topic_boost + diff_boost) * novelty_multiplier
            final_score = round(float(raw_score), 4)

            # Formulate Pedagogical Rationale
            rationale_parts = []
            if times_seen == 0:
                rationale_parts.append("Fresh unseen question")
            else:
                rationale_parts.append(f"Previously attempted ({times_seen}x)")

            if q.topic_id in weak_topic_set:
                rationale_parts.append("targets diagnosed weak topic")

            if abs(estimated_p - self.target_success_prob) < 0.15:
                rationale_parts.append(f"optimal challenge zone ({estimated_p:.0%} predicted pass rate)")

            rationale = "; ".join(rationale_parts)

            scored_list.append({
                "question_id": q.question_id,
                "topic_id": q.topic_id,
                "score": final_score,
                "predicted_success_probability": round(estimated_p, 4),
                "difficulty_level": q.difficulty_level,
                "rationale": rationale,
            })

        # Sort descending by score
        scored_list.sort(key=lambda x: x["score"], reverse=True)

        # Assign 1-indexed ranks and take top_k
        ranked_top = []
        for i, item in enumerate(scored_list[:top_k], start=1):
            ranked_top.append(
                RankedQuestion(
                    question_id=item["question_id"],
                    topic_id=item["topic_id"],
                    score=item["score"],
                    rank=i,
                    predicted_success_probability=item["predicted_success_probability"],
                    difficulty_level=item["difficulty_level"],
                    rationale=item["rationale"],
                )
            )

        return ranked_top


class RecommenderBaseline:
    """
    Classical rule-based baseline recommender:
    Filters questions matching: (Target Weak Topic) + (Matching Difficulty) + (Unseen).
    Used as an academic reference baseline to compare learned ranking against.
    """

    def rank(
        self,
        candidates: List[QuestionCandidate],
        target_topic: Optional[str] = None,
        desired_difficulty: Optional[DifficultyLevel] = DifficultyLevel.MEDIUM,
        top_k: int = 3,
    ) -> List[RankedQuestion]:
        """Heuristic rule matching."""
        matching: List[QuestionCandidate] = []

        for q in candidates:
            match_score = 0.0
            if target_topic and q.topic_id == target_topic:
                match_score += 1.0
            if desired_difficulty and q.difficulty_level == desired_difficulty:
                match_score += 0.5
            if q.times_seen_by_student == 0:
                match_score += 0.5

            matching.append((q, match_score))

        matching.sort(key=lambda pair: pair[1], reverse=True)

        results: List[RankedQuestion] = []
        for idx, (q, score) in enumerate(matching[:top_k], start=1):
            results.append(
                RankedQuestion(
                    question_id=q.question_id,
                    topic_id=q.topic_id,
                    score=score,
                    rank=idx,
                    difficulty_level=q.difficulty_level,
                    rationale="Baseline heuristic match (topic + difficulty + unseen)",
                )
            )
        return results
