"""
Unit Tests for Schemas and Canonical Data Contracts
"""

from datetime import datetime, timezone
import pytest
from pydantic import ValidationError

from app.schemas.interaction import StudentInteraction, INTERACTION_FEATURE_METADATA
from app.schemas.common import FeatureType, DifficultyLevel, TopicStatus, LearningAction
from app.schemas.mastery import MasteryRequest, MasteryScore
from app.schemas.difficulty import DifficultyRequest
from app.schemas.recommendation import QuestionCandidate, RecommendationRequest
from app.schemas.adaptive import AdaptiveActionRequest


def test_student_interaction_valid():
    interaction = StudentInteraction(
        student_id="student_123",
        topic_id="binary-trees",
        question_id="q_101",
        attempt_number=1,
        answer_correct=True,
        time_taken_seconds=32.5,
        source_type="SYNTHETIC",
    )
    assert interaction.student_id == "student_123"
    assert interaction.answer_correct is True
    assert interaction.attempt_number == 1
    assert interaction.source_type == "SYNTHETIC"


def test_student_interaction_source_type_validation():
    # Only REAL or SYNTHETIC allowed
    with pytest.raises(ValidationError):
        StudentInteraction(
            student_id="student_123",
            topic_id="binary-trees",
            question_id="q_101",
            answer_correct=True,
            source_type="INVALID_SOURCE_FLAG",
        )


def test_student_interaction_strips_target_features():
    interaction = StudentInteraction(
        student_id="student_123",
        topic_id="binary-trees",
        question_id="q_101",
        answer_correct=True,
        mastery_score=0.85,
    )
    feature_dict = interaction.to_feature_dict(exclude_targets=True)
    assert "answer_correct" not in feature_dict
    assert "mastery_score" not in feature_dict
    assert feature_dict["student_id"] == "student_123"


def test_feature_metadata_classifications():
    assert INTERACTION_FEATURE_METADATA["answer_correct"] == FeatureType.TARGET
    assert INTERACTION_FEATURE_METADATA["mastery_score"] == FeatureType.TARGET
    assert INTERACTION_FEATURE_METADATA["student_id"] == FeatureType.RAW
    assert INTERACTION_FEATURE_METADATA["previous_accuracy"] == FeatureType.DERIVED


def test_mastery_request_bounds():
    req = MasteryRequest(
        student_id="s1",
        topic_id="t1",
        historical_accuracy=0.75,
        total_attempts=10,
    )
    assert req.historical_accuracy == 0.75

    # Out of bounds accuracy must fail validation
    with pytest.raises(ValidationError):
        MasteryRequest(student_id="s1", topic_id="t1", historical_accuracy=1.5)


def test_recommendation_request_candidate_validation():
    cand = QuestionCandidate(
        question_id="q1",
        topic_id="arrays",
        difficulty=0.6,
        difficulty_level=DifficultyLevel.MEDIUM,
    )
    req = RecommendationRequest(
        student_id="s1",
        candidate_questions=[cand],
        top_k=2,
    )
    assert len(req.candidate_questions) == 1
    assert req.candidate_questions[0].question_id == "q1"


def test_adaptive_request_validation():
    req = AdaptiveActionRequest(
        student_id="s1",
        topic_id="graphs",
        last_answer_correct=False,
        consecutive_wrong=2,
    )
    assert req.consecutive_wrong == 2
    assert req.last_answer_correct is False
