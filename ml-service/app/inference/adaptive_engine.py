"""
Adaptive Learning Engine
Orchestration layer coordinating ML predictions into deterministic, explainable pedagogical actions.
"""

import logging
from typing import Dict, List, Optional

from app.config.settings import settings
from app.inference.predictor import MLPredictorService
from app.schemas.adaptive import (
    AdaptiveActionRequest,
    AdaptiveActionResponse,
    StudentProfilePredictionRequest,
    StudentProfilePredictionResponse,
)
from app.schemas.common import LearningAction, PredictionStatus, TopicStatus, DifficultyLevel
from app.schemas.mastery import MasteryRequest
from app.schemas.difficulty import DifficultyRequest
from app.schemas.topic import TopicClassificationRequest
from app.schemas.recommendation import RecommendationRequest

logger = logging.getLogger("class_royale.ml.inference.adaptive")


class AdaptiveLearningEngine:
    """
    Orchestrates ML model predictions into actionable pedagogical decisions for Class Royale.
    Separates statistical ML prediction from university learning product logic.
    """

    def __init__(self, predictor: MLPredictorService):
        self.predictor = predictor

    def determine_next_action(self, req: AdaptiveActionRequest) -> AdaptiveActionResponse:
        """
        Orchestrates mastery, difficulty, and weak topic checks into a concrete next action.
        """
        history = req.recent_interactions or []

        # 1. Estimate Topic Mastery
        mastery_res = self.predictor.predict_mastery(
            MasteryRequest(
                student_id=req.student_id,
                topic_id=req.topic_id,
                recent_interactions=history,
            )
        )
        current_mastery = mastery_res.mastery.score if mastery_res.mastery else 0.50

        # 2. Check Topic Status
        topic_res = self.predictor.classify_topics(
            TopicClassificationRequest(
                student_id=req.student_id,
                recent_interactions=history,
            )
        )
        current_topic_status = TopicStatus.NORMAL
        for t in topic_res.topics:
            if t.topic_id == req.topic_id:
                current_topic_status = t.status
                break

        # 3. Determine Pedagogical Action (Deterministic Decision Tree)
        action = LearningAction.ANSWER_NEXT_QUESTION
        rationale = "Student performance is stable within the flow state zone."

        consec_wrong = req.consecutive_wrong or 0
        consec_correct = req.consecutive_correct or 0

        # Rule 1: Acute struggle on current concept
        if consec_wrong >= 3 or (req.last_answer_correct is False and consec_wrong >= 2):
            action = LearningAction.LOWER_DIFFICULTY
            rationale = (
                f"Student encountered {consec_wrong} consecutive errors on '{req.topic_id}'. "
                "Temporarily lowering question difficulty to scaffold fundamental concept retention."
            )
        # Rule 2: Topic diagnosed as WEAK requiring revision
        elif current_topic_status == TopicStatus.WEAK or current_mastery < 0.45:
            action = LearningAction.REVISE_TOPIC
            rationale = (
                f"Topic mastery on '{req.topic_id}' is {current_mastery:.1%} (classified as WEAK). "
                "Triggering targeted revision pack before advancing syllabus."
            )
        # Rule 3: High mastery streak -> increase difficulty
        elif consec_correct >= 4 and current_mastery >= 0.80:
            action = LearningAction.INCREASE_DIFFICULTY
            rationale = (
                f"Student demonstrated {consec_correct} consecutive correct answers with {current_mastery:.1%} mastery. "
                "Advancing to higher difficulty / challenge quest to avoid boredom."
            )
        # Rule 4: Weak topics exist outside the current topic
        elif len(topic_res.weak_topics) > 0 and req.topic_id not in topic_res.weak_topics:
            weak_target = topic_res.weak_topics[0]
            action = LearningAction.PRACTICE_WEAK_TOPIC
            rationale = (
                f"Student has mastered current topic, but knowledge gap diagnosed in '{weak_target}'. "
                "Recommending scheduled spaced practice."
            )

        # 4. Recommend Next Questions if candidates were provided
        recommended_ids: List[str] = []
        if req.available_questions and len(req.available_questions) > 0:
            rec_res = self.predictor.recommend_questions(
                RecommendationRequest(
                    student_id=req.student_id,
                    topic_id=req.topic_id,
                    candidate_questions=req.available_questions,
                    student_mastery=current_mastery,
                    exclude_question_ids=[req.current_question_id] if req.current_question_id else [],
                    top_k=3,
                )
            )
            recommended_ids = [q.question_id for q in rec_res.ranked_questions]

        # 5. Question prediction for the top recommended question
        diff_pred = None
        if recommended_ids:
            diff_res = self.predictor.predict_difficulty(
                DifficultyRequest(
                    question_id=recommended_ids[0],
                    topic_id=req.topic_id,
                    student_id=req.student_id,
                    student_mastery=current_mastery,
                )
            )
            diff_pred = diff_res.prediction

        return AdaptiveActionResponse(
            student_id=req.student_id,
            topic_id=req.topic_id,
            action=action,
            action_rationale=rationale,
            mastery=mastery_res.mastery,
            topic_status=next((t for t in topic_res.topics if t.topic_id == req.topic_id), None),
            question_prediction=diff_pred,
            recommended_question_ids=recommended_ids,
            model_versions={
                "mastery_predictor": mastery_res.model_version or settings.default_mastery_model_version,
                "difficulty_predictor": settings.default_difficulty_model_version,
                "topic_classifier": topic_res.model_version or settings.default_topic_model_version,
                "recommender": settings.default_recommender_version,
            },
            status=PredictionStatus.SUCCESS,
            is_demo=mastery_res.is_demo,
        )

    def generate_student_profile(
        self,
        req: StudentProfilePredictionRequest
    ) -> StudentProfilePredictionResponse:
        """Constructs full syllabus mastery profile for student analytics and faculty overview."""
        topics_map: Dict[str, list] = {}
        for interaction in req.interactions:
            topics_map.setdefault(interaction.topic_id, []).append(interaction)

        topic_masteries: Dict[str, float] = {}
        weak_topics: List[str] = []
        strong_topics: List[str] = []

        for tid, items in topics_map.items():
            correct = sum(1 for x in items if x.answer_correct)
            acc = correct / len(items)
            smoothed_score = self.predictor.mastery_baseline.predict(correct, len(items))
            topic_masteries[tid] = smoothed_score

            if smoothed_score < 0.50:
                weak_topics.append(tid)
            elif smoothed_score >= 0.75:
                strong_topics.append(tid)

        overall = float(sum(topic_masteries.values()) / max(1, len(topic_masteries)))

        recommended_action = (
            LearningAction.REVISE_TOPIC if weak_topics else LearningAction.ANSWER_NEXT_QUESTION
        )

        return StudentProfilePredictionResponse(
            student_id=req.student_id,
            overall_mastery=round(overall, 4),
            topic_masteries=topic_masteries,
            weak_topics=weak_topics,
            strong_topics=strong_topics,
            recommended_action=recommended_action,
            model_versions={"profile_aggregator": "v0.1.0"},
            status=PredictionStatus.SUCCESS,
        )
