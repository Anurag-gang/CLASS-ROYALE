"""
Data Cleaning and Sanitization for Educational Interaction Streams
Handles missing, unavailable, unknown, and derived values across heterogeneous educational datasets.
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


class MissingValueStrategy:
    """Explicit taxonomy of data absences in educational logs."""
    MISSING = "MISSING"          # Field was expected but empty/null in source row
    UNAVAILABLE = "UNAVAILABLE"  # Source dataset does not measure this concept (e.g. no hint telemetry)
    UNKNOWN = "UNKNOWN"          # Value could not be mapped/resolved in taxonomy
    DERIVED = "DERIVED"          # Imputed or computed from historical window


class DataCleaner:
    """
    Cleans raw telemetry and enforces bounded educational constraints.
    Prevents NaNs, infinite response times, and uncalibrated scores from corrupting models.
    """

    def __init__(
        self,
        default_latency_seconds: float = 45.0,
        max_latency_seconds: float = 1800.0,  # 30 minutes cap
    ):
        self.default_latency_seconds = default_latency_seconds
        self.max_latency_seconds = max_latency_seconds

    def clean_interaction_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitizes a single dictionary interaction record."""
        cleaned = record.copy()

        # Sanitize identifiers
        cleaned["student_id"] = str(cleaned.get("student_id") or "UNKNOWN_STUDENT").strip()
        cleaned["topic_id"] = str(cleaned.get("topic_id") or "UNKNOWN_TOPIC").strip()
        cleaned["question_id"] = str(cleaned.get("question_id") or "UNKNOWN_QUESTION").strip()

        # Ensure boolean answer_correct
        raw_correct = cleaned.get("answer_correct")
        if isinstance(raw_correct, (bool, np.bool_)):
            cleaned["answer_correct"] = bool(raw_correct)
        elif raw_correct in (1, "1", "true", "True", "TRUE", "correct"):
            cleaned["answer_correct"] = True
        else:
            cleaned["answer_correct"] = False

        # Attempt number bounded >= 1
        raw_attempt = cleaned.get("attempt_number")
        try:
            cleaned["attempt_number"] = max(1, int(raw_attempt)) if raw_attempt is not None else 1
        except (ValueError, TypeError):
            cleaned["attempt_number"] = 1

        # Response latency sanitization
        raw_time = cleaned.get("time_taken_seconds")
        if raw_time is None or np.isnan(float(raw_time) if isinstance(raw_time, (int, float, str)) else np.nan):
            cleaned["time_taken_seconds"] = self.default_latency_seconds
        else:
            try:
                t = float(raw_time)
                cleaned["time_taken_seconds"] = float(np.clip(t, 1.0, self.max_latency_seconds))
            except (ValueError, TypeError):
                cleaned["time_taken_seconds"] = self.default_latency_seconds

        # Accuracy clipping [0.0, 1.0]
        for acc_field in ["previous_accuracy", "recent_accuracy", "question_difficulty", "mastery_score"]:
            val = cleaned.get(acc_field)
            if val is not None:
                try:
                    fval = float(val)
                    if not np.isnan(fval):
                        cleaned[acc_field] = float(np.clip(fval, 0.0, 1.0))
                    else:
                        cleaned[acc_field] = None
                except (ValueError, TypeError):
                    cleaned[acc_field] = None

        # Hints used bounded >= 0
        raw_hints = cleaned.get("hints_used")
        if raw_hints is not None:
            try:
                cleaned["hints_used"] = max(0, int(raw_hints))
            except (ValueError, TypeError):
                cleaned["hints_used"] = 0
        else:
            cleaned["hints_used"] = 0

        return cleaned

    def clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Sanitizes a Pandas DataFrame of interactions."""
        if df.empty:
            return df.copy()

        df_clean = df.copy()

        # Fill missing IDs with UNKNOWN
        for id_col in ["student_id", "topic_id", "question_id"]:
            if id_col in df_clean.columns:
                df_clean[id_col] = df_clean[id_col].fillna("UNKNOWN").astype(str).str.strip()

        # Enforce answer_correct boolean
        if "answer_correct" in df_clean.columns:
            df_clean["answer_correct"] = df_clean["answer_correct"].isin([True, 1, "1", "True", "true"])

        # Bounded numeric columns
        if "attempt_number" in df_clean.columns:
            df_clean["attempt_number"] = pd.to_numeric(df_clean["attempt_number"], errors="coerce").fillna(1).clip(lower=1).astype(int)

        if "time_taken_seconds" in df_clean.columns:
            df_clean["time_taken_seconds"] = pd.to_numeric(df_clean["time_taken_seconds"], errors="coerce").fillna(self.default_latency_seconds).clip(1.0, self.max_latency_seconds)

        for col in ["previous_accuracy", "recent_accuracy", "question_difficulty", "mastery_score"]:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce").clip(0.0, 1.0)

        if "hints_used" in df_clean.columns:
            df_clean["hints_used"] = pd.to_numeric(df_clean["hints_used"], errors="coerce").fillna(0).clip(lower=0).astype(int)

        return df_clean
