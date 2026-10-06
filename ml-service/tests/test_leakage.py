"""
Unit Tests for Data Leakage Prevention
Guarantees that target labels and future interaction telemetry cannot leak into feature vectors.
"""

from datetime import datetime, timedelta, timezone
import pytest

from app.preprocessing.feature_pipeline import FeatureExtractor
from app.schemas.interaction import StudentInteraction


def test_feature_extractor_assert_no_leakage():
    extractor = FeatureExtractor()

    # Valid clean feature dict
    clean_dict = {
        "student_total_attempts": 5.0,
        "student_overall_accuracy": 0.80,
    }
    extractor.assert_no_leakage(clean_dict)  # Should not raise

    # Leaked target dictionary
    leaked_dict = {
        "student_total_attempts": 5.0,
        "answer_correct": True,  # TARGET LEAKAGE!
    }
    with pytest.raises(AssertionError, match="DATA LEAKAGE DETECTED"):
        extractor.assert_no_leakage(leaked_dict)


def test_feature_extractor_temporal_order_prevents_future_leakage():
    """
    Ensures that historical features strictly respect chronological order
    and do not include the current/future question interaction event.
    """
    extractor = FeatureExtractor()

    base_time = datetime(2026, 10, 1, 10, 0, 0, tzinfo=timezone.utc)
    t1 = base_time
    t2 = base_time + timedelta(minutes=5)
    t3 = base_time + timedelta(minutes=10)

    # Student answers Q1 (Correct), Q2 (Wrong), and is about to answer Q3
    history = [
        StudentInteraction(
            student_id="s1",
            topic_id="trees",
            question_id="q1",
            answer_correct=True,
            time_taken_seconds=30.0,
            timestamp=t1,
            source_type="SYNTHETIC",
        ),
        StudentInteraction(
            student_id="s1",
            topic_id="trees",
            question_id="q2",
            answer_correct=False,
            time_taken_seconds=60.0,
            timestamp=t2,
            source_type="SYNTHETIC",
        ),
    ]

    features = extractor.extract_features_from_history(
        history=history,
        target_topic_id="trees",
        target_question_id="q3",
        current_timestamp=t3,
    )

    extractor.assert_no_leakage(features)
    assert features["student_total_attempts"] == 2.0
    assert features["student_overall_accuracy"] == 0.50
    assert features["student_consecutive_wrong"] == 1.0
    assert features["student_consecutive_correct"] == 0.0
