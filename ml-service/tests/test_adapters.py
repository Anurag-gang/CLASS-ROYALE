"""
Unit and Integration Tests for Phase 2 Dataset Adapters and Manager
"""

import pytest
from pathlib import Path
import pandas as pd
import numpy as np

from app.preprocessing.adapters.mathe_adapter import MathEAdapter
from app.preprocessing.adapters.ednet_adapter import EdNetKT1Adapter
from dataset_manager.verifier import verify_dataset_checksum
from dataset_manager.status import get_dataset_status
from dataset_manager.config import DATASET_SPECS


def test_mathe_adapter_pipeline():
    """Validates MathE full normalization lifecycle and anti-leakage features."""
    adapter = MathEAdapter()
    raw = adapter.load()
    assert adapter.validate(raw)
    assert len(raw) == 9546

    cleaned = adapter.clean(raw)
    mapped = adapter.map_schema(cleaned)
    assert "student_id" in mapped.columns
    assert "question_id" in mapped.columns
    assert "answer_correct" in mapped.columns

    transformed = adapter.transform(mapped)
    assert len(transformed) == 9546
    assert "previous_accuracy" in transformed.columns
    assert "recent_accuracy" in transformed.columns
    assert "mastery_score" in transformed.columns

    # Verify anti-leakage on first interaction of each student:
    # previous_attempts must be 0 and previous_accuracy must default to prior (0.50)
    first_rows = transformed.groupby("student_id").first()
    assert (first_rows["previous_attempts"] == 0).all()
    assert (first_rows["previous_accuracy"] == 0.50).all()


def test_ednet_questions_metadata():
    """Validates EdNet question metadata loading and integrity."""
    adapter = EdNetKT1Adapter()
    q_df = adapter.load_questions_metadata()
    assert len(q_df) == 13169
    assert "question_id" in q_df.columns
    assert "correct_answer" in q_df.columns
    assert "part" in q_df.columns
    assert set(q_df["part"].unique()) == {1, 2, 3, 4, 5, 6, 7}


def test_dataset_status():
    """Validates lifecycle status reporting."""
    status_mathe = get_dataset_status("mathe")
    assert status_mathe["state"] == "VALIDATED_AND_NORMALIZED"

    status_ednet = get_dataset_status("ednet_kt1")
    assert status_ednet["state"] == "VALIDATED_AND_NORMALIZED"

    status_assist = get_dataset_status("assistments")
    assert status_assist["state"] == "DOWNLOAD_REQUIRES_MANUAL_ACTION"


def test_dataset_verification():
    """Validates SHA256 checksum verification."""
    ver_mathe = verify_dataset_checksum("mathe")
    assert ver_mathe["is_valid"] is True
    assert ver_mathe["status"] == "CHECKSUM_VALID"
