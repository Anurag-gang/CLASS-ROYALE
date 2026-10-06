"""
Unit Tests for Inference, Placeholder Mode, and Adaptive Learning Decision Engine
"""

from pathlib import Path
import pytest

from app.config.settings import settings
from app.registry.model_registry import ModelRegistry
from app.registry.store import JoblibArtifactStore
from app.inference.model_loader import ModelLoader
from app.inference.predictor import MLPredictorService
from app.inference.adaptive_engine import AdaptiveLearningEngine
from app.schemas.common import PredictionStatus, LearningAction
from app.schemas.mastery import MasteryRequest
from app.schemas.difficulty import DifficultyRequest
from app.schemas.adaptive import AdaptiveActionRequest
from app.schemas.interaction import StudentInteraction


@pytest.fixture
def test_predictor(tmp_path):
    registry = ModelRegistry(registry_dir=tmp_path / "models", store=JoblibArtifactStore(tmp_path / "models"))
    loader = ModelLoader(registry=registry)
    return MLPredictorService(loader=loader)


@pytest.fixture
def adaptive_engine(test_predictor):
    return AdaptiveLearningEngine(predictor=test_predictor)


def test_placeholder_mode_returns_model_not_trained(test_predictor):
    settings.ml_mode = "placeholder"
    settings.demo_mode = False

    req = MasteryRequest(student_id="student_x", topic_id="os-kernel")
    res = test_predictor.predict_mastery(req)

    assert res.status == PredictionStatus.MODEL_NOT_TRAINED
    assert res.is_demo is False
    assert res.mastery is None
    assert "No trained model artifact is currently available" in res.message


def test_demo_mode_returns_explicit_demo_data(test_predictor):
    settings.demo_mode = True

    req = MasteryRequest(student_id="student_demo", topic_id="os-kernel")
    res = test_predictor.predict_mastery(req)

    assert res.status == PredictionStatus.DEMO_DATA
    assert res.is_demo is True
    assert res.mastery is not None
    assert res.mastery.score > 0.0

    settings.demo_mode = False  # Reset


def test_baseline_mode_execution(test_predictor):
    settings.ml_mode = "placeholder"
    settings.demo_mode = False

    history = [
        StudentInteraction(
            student_id="s1",
            topic_id="trees",
            question_id="q1",
            answer_correct=True,
            source_type="SYNTHETIC",
        ),
        StudentInteraction(
            student_id="s1",
            topic_id="trees",
            question_id="q2",
            answer_correct=True,
            source_type="SYNTHETIC",
        ),
    ]

    req = MasteryRequest(
        student_id="s1",
        topic_id="trees",
        recent_interactions=history,
    )
    res = test_predictor.predict_mastery(req, force_baseline=True)
    assert res.status == PredictionStatus.FALLBACK_BASELINE
    assert res.mastery is not None
    assert res.mastery.score > 0.50


def test_adaptive_engine_lower_difficulty_on_consecutive_errors(adaptive_engine):
    req = AdaptiveActionRequest(
        student_id="s1",
        topic_id="compilers",
        consecutive_wrong=3,
        last_answer_correct=False,
    )
    res = adaptive_engine.determine_next_action(req)
    assert res.action == LearningAction.LOWER_DIFFICULTY
    assert "consecutive errors" in res.action_rationale.lower()


def test_adaptive_engine_increase_difficulty_on_streak(adaptive_engine):
    # Student with high streak and high recent correct history
    history = [
        StudentInteraction(student_id="s1", topic_id="dsa", question_id=f"q_{i}", answer_correct=True, source_type="SYNTHETIC")
        for i in range(8)
    ]
    req = AdaptiveActionRequest(
        student_id="s1",
        topic_id="dsa",
        consecutive_correct=5,
        last_answer_correct=True,
        recent_interactions=history,
    )
    res = adaptive_engine.determine_next_action(req)
    assert res.action == LearningAction.INCREASE_DIFFICULTY


def test_adaptive_engine_revise_topic_on_weakness(adaptive_engine):
    # Student with poor topic history
    history = [
        StudentInteraction(student_id="s1", topic_id="dsa", question_id=f"q_{i}", answer_correct=False, source_type="SYNTHETIC")
        for i in range(5)
    ]
    req = AdaptiveActionRequest(
        student_id="s1",
        topic_id="dsa",
        consecutive_wrong=1,
        recent_interactions=history,
    )
    res = adaptive_engine.determine_next_action(req)
    assert res.action == LearningAction.REVISE_TOPIC
