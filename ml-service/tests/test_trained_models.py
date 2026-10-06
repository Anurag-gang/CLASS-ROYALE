"""
Phase 3 Test Suite: Trained Models & Active Serving Verification
Verifies that real trained model artifacts in artifacts/models/ load properly,
produce valid probabilistic inferences and pedagogical explainability weights,
and serve active responses through MLPredictorService and FastAPI endpoints.
"""

from pathlib import Path
import numpy as np
import pytest

from app.config.settings import settings
from app.registry.model_registry import ModelRegistry
from app.registry.store import JoblibArtifactStore
from app.inference.model_loader import ModelLoader
from app.inference.predictor import MLPredictorService
from app.schemas.common import PredictionStatus, DifficultyLevel, TopicStatus
from app.schemas.mastery import MasteryRequest
from app.schemas.difficulty import DifficultyRequest
from app.schemas.topic import TopicClassificationRequest, TopicEvaluationInput
from app.schemas.recommendation import RecommendationRequest, QuestionCandidate
from app.schemas.interaction import StudentInteraction


@pytest.fixture(scope="module")
def real_loader():
    registry_dir = settings.resolve_path(settings.model_registry_path)
    store = JoblibArtifactStore(registry_dir)
    registry = ModelRegistry(registry_dir=registry_dir, store=store)
    return ModelLoader(registry=registry, store=store)


@pytest.fixture(scope="module")
def active_predictor(real_loader):
    settings.ml_mode = "active"
    settings.demo_mode = False
    return MLPredictorService(loader=real_loader)


# =============================================================================
# 1. Trained Model Loading & Artifact Integrity
# =============================================================================
def test_all_trained_model_artifacts_exist_and_load(real_loader):
    core_models = [
        "mastery_predictor",
        "question_difficulty_predictor",
        "weak_topic_classifier",
        "question_recommender",
    ]
    for model_name in core_models:
        model = real_loader.load_model(model_name, "v1.0.0")
        assert model is not None, f"Model artifact {model_name}:v1.0.0 failed to load from disk"
        assert getattr(model, "is_trained", False) is True, f"Model {model_name} is_trained flag is not True"


# =============================================================================
# 2. Mastery Predictor Verification
# =============================================================================
def test_mastery_predictor_inference_and_explainability(real_loader):
    mastery_model = real_loader.load_model("mastery_predictor", "v1.0.0")
    assert mastery_model.algorithm_name in ["logistic_regression", "random_forest", "gradient_boosting"]

    # Sample: [previous_accuracy, recent_accuracy, attempt_number, time_taken_seconds, question_difficulty]
    sample_features = np.array([[0.85, 0.90, 8.0, 22.0, 0.50]], dtype=np.float64)
    prob = mastery_model.predict_proba(sample_features)
    assert len(prob) == 1
    assert 0.0 <= prob[0] <= 1.0
    # High previous accuracy should produce high predicted mastery probability
    assert prob[0] > 0.50

    explanation = mastery_model.explain(sample_features[0])
    assert "algorithm" in explanation
    assert "top_contributing_features" in explanation
    assert len(explanation["top_contributing_features"]) > 0


# =============================================================================
# 3. Question Difficulty Predictor Verification
# =============================================================================
def test_difficulty_predictor_calibration_and_bands(real_loader):
    diff_model = real_loader.load_model("question_difficulty_predictor", "v1.0.0")

    # Sample: [question_difficulty, previous_accuracy, recent_accuracy, attempt_number, time_taken_seconds]
    easy_sample = np.array([[0.20, 0.90, 0.95, 3.0, 15.0]], dtype=np.float64)
    hard_sample = np.array([[0.85, 0.20, 0.10, 1.0, 85.0]], dtype=np.float64)

    easy_prob = float(diff_model.predict_proba(easy_sample)[0])
    hard_prob = float(diff_model.predict_proba(hard_sample)[0])

    assert 0.0 <= easy_prob <= 1.0
    assert 0.0 <= hard_prob <= 1.0
    assert easy_prob > hard_prob, "Easy question context must yield higher success probability than hard question"

    easy_level = diff_model.predict_difficulty_level(easy_prob)
    hard_level = diff_model.predict_difficulty_level(hard_prob)
    assert easy_level in [DifficultyLevel.EASY, DifficultyLevel.MEDIUM]
    assert hard_level in [DifficultyLevel.MEDIUM, DifficultyLevel.HARD]


# =============================================================================
# 4. Weak Topic Classifier Verification
# =============================================================================
def test_weak_topic_classifier_predictions(real_loader):
    topic_model = real_loader.load_model("weak_topic_classifier", "v1.0.0")

    # Sample: [topic_accuracy, recent_accuracy, total_attempts, consecutive_wrong, average_time_seconds]
    # Weak candidate: 0.20 acc, 4 consecutive wrong
    weak_sample = np.array([[0.20, 0.00, 5.0, 4.0, 55.0]], dtype=np.float64)
    # Strong candidate: 0.95 acc, 0 wrong
    strong_sample = np.array([[0.95, 1.00, 15.0, 0.0, 18.0]], dtype=np.float64)

    weak_pred = int(topic_model.predict(weak_sample)[0])
    strong_pred = int(topic_model.predict(strong_sample)[0])

    assert weak_pred == 0  # 0 = WEAK
    assert strong_pred == 2  # 2 = STRONG

    weak_status = topic_model.CLASS_LABELS[weak_pred]
    strong_status = topic_model.CLASS_LABELS[strong_pred]
    assert weak_status == TopicStatus.WEAK
    assert strong_status == TopicStatus.STRONG


# =============================================================================
# 5. Question Recommender ZPD Flow & Weak Topic Boost Verification
# =============================================================================
def test_question_recommender_ranking_and_boost(real_loader):
    recommender = real_loader.load_model("question_recommender", "v1.0.0")

    candidates = [
        QuestionCandidate(question_id="q_norm", topic_id="arrays", difficulty=0.60, times_seen_by_student=0),
        QuestionCandidate(question_id="q_weak", topic_id="binary_trees", difficulty=0.65, times_seen_by_student=0),
        QuestionCandidate(question_id="q_repeated", topic_id="arrays", difficulty=0.60, times_seen_by_student=4),
    ]

    # When student has weak topic in "binary_trees", q_weak should receive boost
    ranked = recommender.rank_candidates(
        candidates=candidates,
        student_mastery=0.65,
        weak_topics=["binary_trees"],
        top_k=3,
    )
    assert len(ranked) == 3
    assert ranked[0].question_id == "q_weak", "Question targeting diagnosed weak topic should rank highest"

    # Repeated question must receive novelty penalty
    repeated_item = next(x for x in ranked if x.question_id == "q_repeated")
    norm_item = next(x for x in ranked if x.question_id == "q_norm")
    assert repeated_item.score < norm_item.score, "Repeated question should have lower score than fresh question"


# =============================================================================
# 6. End-to-End Active Inference via MLPredictorService
# =============================================================================
def test_active_mode_predict_mastery(active_predictor):
    req = MasteryRequest(
        student_id="student_prod_01",
        topic_id="linear_algebra_matrices",
        historical_accuracy=0.82,
        recent_accuracy=0.85,
        total_attempts=14,
        average_time_seconds=20.0,
    )
    res = active_predictor.predict_mastery(req)

    assert res.status == PredictionStatus.SUCCESS
    assert res.is_demo is False
    assert res.model_version == "v1.0.0"
    assert res.mastery is not None
    assert 0.0 <= res.mastery.score <= 1.0
    assert len(res.mastery.contributing_factors) > 0


def test_active_mode_predict_difficulty(active_predictor):
    req = DifficultyRequest(
        question_id="mathe_q_101",
        student_id="student_prod_01",
        historical_question_accuracy=0.60,
        student_mastery=0.75,
        student_recent_accuracy=0.80,
    )
    res = active_predictor.predict_difficulty(req)

    assert res.status == PredictionStatus.SUCCESS
    assert res.is_demo is False
    assert res.model_version == "v1.0.0"
    assert res.prediction is not None
    assert 0.0 <= res.prediction.success_probability <= 1.0
    assert res.prediction.predicted_difficulty in [DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD]


def test_active_mode_classify_topics(active_predictor):
    req = TopicClassificationRequest(
        student_id="student_prod_01",
        topics=[
            TopicEvaluationInput(
                topic_id="differential_equations",
                topic_accuracy=0.35,
                recent_topic_accuracy=0.20,
                total_attempts=8,
                consecutive_wrong=3,
                average_time_seconds=60.0,
            ),
            TopicEvaluationInput(
                topic_id="vector_calculus",
                topic_accuracy=0.92,
                recent_topic_accuracy=1.00,
                total_attempts=12,
                consecutive_wrong=0,
                average_time_seconds=18.0,
            ),
        ],
    )
    res = active_predictor.classify_topics(req)

    assert res.status == PredictionStatus.SUCCESS
    assert res.is_demo is False
    assert res.model_version == "v1.0.0"
    assert len(res.topics) == 2
    assert "differential_equations" in res.weak_topics
    assert "vector_calculus" not in res.weak_topics


def test_active_mode_recommend_questions(active_predictor):
    req = RecommendationRequest(
        student_id="student_prod_01",
        candidate_questions=[
            QuestionCandidate(question_id="q1", topic_id="calculus", difficulty=0.65, times_seen_by_student=0),
            QuestionCandidate(question_id="q2", topic_id="algebra", difficulty=0.80, times_seen_by_student=0),
        ],
        student_mastery=0.70,
        top_k=2,
    )
    res = active_predictor.recommend_questions(req)

    assert res.status == PredictionStatus.SUCCESS
    assert res.is_demo is False
    assert res.model_version == "v1.0.0"
    assert len(res.ranked_questions) == 2
    assert res.top_question_id is not None
