"""
Unit Tests for Machine Learning Models and Classical Baselines
"""

import numpy as np
import pytest

from app.models.mastery_predictor import MasteryPredictor, MasteryBaseline
from app.models.difficulty_predictor import QuestionDifficultyPredictor, DifficultyBaseline
from app.models.weak_topic_classifier import WeakTopicClassifier, WeakTopicBaseline
from app.models.question_recommender import QuestionRecommender, RecommenderBaseline
from app.schemas.common import DifficultyLevel, TopicStatus
from app.schemas.recommendation import QuestionCandidate


def test_mastery_predictor_candidates_and_fit():
    # Synthetic feature matrix: 10 rows, 4 features
    X = np.array([
        [0.8, 0.9, 1.0, 30.0],
        [0.2, 0.3, 3.0, 90.0],
        [0.7, 0.8, 1.0, 40.0],
        [0.3, 0.2, 2.0, 80.0],
        [0.9, 1.0, 1.0, 25.0],
        [0.1, 0.0, 4.0, 110.0],
        [0.75, 0.70, 1.0, 35.0],
        [0.4, 0.5, 2.0, 70.0],
        [0.85, 0.90, 1.0, 20.0],
        [0.35, 0.40, 3.0, 85.0],
    ])
    y = np.array([1, 0, 1, 0, 1, 0, 1, 0, 1, 0])

    for algo in ["logistic_regression", "random_forest", "gradient_boosting"]:
        model = MasteryPredictor(model_version="v0.1.0", algorithm_name=algo)
        assert model.is_trained is False

        model.fit(X, y, feature_names=["prev_acc", "rec_acc", "attempt", "time"])
        assert model.is_trained is True

        proba = model.predict_proba(X[:2])
        assert len(proba) == 2
        assert 0.0 <= proba[0] <= 1.0

        explanation = model.explain(X[0])
        assert "algorithm" in explanation


def test_mastery_baseline_smoothing():
    baseline = MasteryBaseline()
    # 0 attempts -> prior (2/4 = 0.50)
    cold_score = baseline.predict(0, 0)
    assert cold_score == 0.50

    # 1/1 attempt -> (1+2)/(1+4) = 3/5 = 0.60 (avoids false 100% mastery)
    single_correct = baseline.predict(1, 1)
    assert single_correct == 0.60

    # High sample size converges towards empirical rate
    high_mastery = baseline.predict(18, 20)
    assert high_mastery > 0.80


def test_difficulty_predictor():
    X = np.array([[0.5, 0.8], [0.8, 0.2], [0.3, 0.9], [0.9, 0.1]])
    y = np.array([1, 0, 1, 0])

    model = QuestionDifficultyPredictor(algorithm_name="logistic_regression")
    model.fit(X, y, feature_names=["difficulty", "student_mastery"])

    probs = model.predict_proba(X)
    assert len(probs) == 4
    for p in probs:
        assert 0.0 <= p <= 1.0
        level = model.predict_difficulty_level(p)
        assert level in (DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD)


def test_difficulty_baseline():
    baseline = DifficultyBaseline()
    res = baseline.predict(global_accuracy=0.80, student_mastery=0.90)
    assert res["predicted_difficulty"] == DifficultyLevel.EASY
    assert res["success_probability"] > 0.75

    res_hard = baseline.predict(global_accuracy=0.30, student_mastery=0.20)
    assert res_hard["predicted_difficulty"] == DifficultyLevel.HARD


def test_weak_topic_classifier():
    X = np.array([
        [0.2, 0.1],  # Weak
        [0.6, 0.65], # Normal
        [0.9, 0.88], # Strong
        [0.3, 0.25], # Weak
        [0.55, 0.6], # Normal
        [0.85, 0.9], # Strong
    ])
    y = np.array([0, 1, 2, 0, 1, 2])  # 0=WEAK, 1=NORMAL, 2=STRONG

    classifier = WeakTopicClassifier(algorithm_name="random_forest")
    classifier.fit(X, y, feature_names=["acc", "recent_acc"])

    preds = classifier.predict(X)
    assert len(preds) == 6


def test_weak_topic_baseline():
    baseline = WeakTopicBaseline()

    weak_res = baseline.predict(topic_accuracy=0.35, total_attempts=5)
    assert weak_res["status"] == TopicStatus.WEAK
    assert weak_res["intervention_recommended"] is True

    streak_fail_res = baseline.predict(topic_accuracy=0.60, consecutive_wrong=3)
    assert streak_fail_res["status"] == TopicStatus.WEAK
    assert streak_fail_res["intervention_recommended"] is True

    strong_res = baseline.predict(topic_accuracy=0.85, total_attempts=8)
    assert strong_res["status"] == TopicStatus.STRONG
    assert strong_res["intervention_recommended"] is False


def test_question_recommender():
    recommender = QuestionRecommender()

    candidates = [
        QuestionCandidate(question_id="q1", topic_id="trees", difficulty=0.5, difficulty_level=DifficultyLevel.MEDIUM, times_seen_by_student=0),
        QuestionCandidate(question_id="q2", topic_id="trees", difficulty=0.8, difficulty_level=DifficultyLevel.HARD, times_seen_by_student=3),  # High penalty
        QuestionCandidate(question_id="q3", topic_id="arrays", difficulty=0.5, difficulty_level=DifficultyLevel.MEDIUM, times_seen_by_student=0),
    ]

    # Trees is weak -> q1 should score higher than q3 and q2
    ranked = recommender.rank_candidates(
        candidates=candidates,
        student_mastery=0.65,
        weak_topics=["trees"],
        top_k=3,
    )
    assert len(ranked) == 3
    assert ranked[0].question_id == "q1"
    assert ranked[0].score > ranked[1].score
