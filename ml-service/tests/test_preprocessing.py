"""
Unit Tests for Preprocessing, Cleaning, Encoding, and Dataset Adapters
"""

import numpy as np
import pandas as pd
import pytest

from app.preprocessing.cleaners import DataCleaner
from app.preprocessing.encoders import CategoricalEncoder, DifficultyLevelEncoder
from app.preprocessing.scalers import RobustTelemetryScaler
from app.preprocessing.adapters.mock_adapter import MockDatasetAdapter


def test_data_cleaner_dict():
    cleaner = DataCleaner()
    raw = {
        "student_id": "  student_01  ",
        "topic_id": "trees",
        "question_id": "q1",
        "answer_correct": "true",
        "attempt_number": -5,  # Invalid
        "time_taken_seconds": 99999.0,  # Extreme outlier
        "hints_used": None,
        "previous_accuracy": 1.25,  # Out of range
    }
    cleaned = cleaner.clean_interaction_dict(raw)
    assert cleaned["student_id"] == "student_01"
    assert cleaned["answer_correct"] is True
    assert cleaned["attempt_number"] == 1
    assert cleaned["time_taken_seconds"] <= cleaner.max_latency_seconds
    assert cleaned["hints_used"] == 0
    assert cleaned["previous_accuracy"] == 1.0


def test_data_cleaner_dataframe():
    cleaner = DataCleaner()
    df = pd.DataFrame([
        {"student_id": " s1 ", "topic_id": "t1", "question_id": "q1", "answer_correct": 1, "attempt_number": 0},
        {"student_id": None, "topic_id": "t2", "question_id": "q2", "answer_correct": 0, "attempt_number": 3},
    ])
    df_clean = cleaner.clean_dataframe(df)
    assert df_clean["student_id"].iloc[0] == "s1"
    assert df_clean["student_id"].iloc[1] == "UNKNOWN"
    assert df_clean["attempt_number"].iloc[0] == 1
    assert df_clean["answer_correct"].iloc[0] is True or df_clean["answer_correct"].iloc[0] == 1


def test_categorical_encoder_oov():
    encoder = CategoricalEncoder(oov_token="<OOV>")
    cats = ["trees", "graphs", "arrays"]
    encoder.fit(cats)

    # Encode known and unknown
    encoded = encoder.transform(["trees", "sorting", "graphs"])
    assert encoded[0] != 0  # known
    assert encoded[1] == 0  # unseen category mapped to OOV index 0
    assert encoded[2] != 0  # known


def test_difficulty_encoder():
    assert DifficultyLevelEncoder.encode("EASY") == 0.25
    assert DifficultyLevelEncoder.encode("HARD") == 0.85
    assert DifficultyLevelEncoder.decode(0.20) == "HARD"
    assert DifficultyLevelEncoder.decode(0.80) == "EASY"


def test_robust_scaler():
    scaler = RobustTelemetryScaler()
    X = np.array([
        [10.0, 1.0],
        [20.0, 2.0],
        [30.0, 3.0],
        [1000.0, 50.0],  # Outliers
    ])
    scaled = scaler.fit_transform(X, ["time", "attempts"])
    assert scaled.shape == X.shape
    assert scaler.is_fitted is True


def test_mock_dataset_adapter():
    adapter = MockDatasetAdapter()
    raw = adapter.load()
    assert adapter.validate(raw) is True

    mapped = adapter.map_schema(raw)
    assert "student_id" in mapped.columns
    assert "question_id" in mapped.columns

    cleaned = adapter.clean(mapped)
    interactions = adapter.transform(cleaned)
    assert len(interactions) == len(raw)
    assert interactions[0].student_id == "test_s1"
    assert interactions[0].source_type == "SYNTHETIC"
