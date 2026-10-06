"""
MathE Dataset Adapter
Transforms UCI 'Assessing Mathematics Learning in Higher Education' dataset
into the normalized Class Royale canonical schema with strict anti-leakage feature calculation.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
import numpy as np

from .base_adapter import DatasetAdapter


class MathEAdapter(DatasetAdapter):
    """
    Adapter for UCI MathE Dataset.
    Original columns:
      ['Student ID', 'Student Country', 'Question ID', 'Type of Answer',
       'Question Level', 'Topic', 'Subtopic', 'Keywords']
    """

    # Provenance specification for MathE mapping
    FEATURE_PROVENANCE = {
        "student_id": {"source_type": "OBSERVED", "original_col": "Student ID"},
        "course_id": {"source_type": "MISSING", "notes": "MathE does not provide course context"},
        "module_id": {"source_type": "DERIVED", "original_col": "Subtopic", "derivation": "Slugified subtopic"},
        "topic_id": {"source_type": "OBSERVED", "original_col": "Topic", "derivation": "Slugified topic string"},
        "question_id": {"source_type": "OBSERVED", "original_col": "Question ID"},
        "question_difficulty": {"source_type": "DERIVED", "original_col": "Question Level", "derivation": "Basic=0.35, Advanced=0.75"},
        "attempt_number": {"source_type": "DERIVED", "derivation": "1-indexed rolling attempts per (student, question)"},
        "previous_attempts": {"source_type": "DERIVED", "derivation": "Attempts prior to this interaction (shift 1)"},
        "previous_accuracy": {"source_type": "DERIVED", "derivation": "Expanding student accuracy prior to this interaction (shift 1)"},
        "recent_accuracy": {"source_type": "DERIVED", "derivation": "Rolling 5-interaction student accuracy prior to this interaction (shift 1)"},
        "time_taken_seconds": {"source_type": "MISSING", "notes": "No latency telemetry in MathE"},
        "hints_used": {"source_type": "MISSING", "notes": "No hint tracking in MathE"},
        "answer_correct": {"source_type": "OBSERVED", "original_col": "Type of Answer", "notes": "1=Correct, 0=Incorrect"},
        "timestamp": {"source_type": "MISSING", "notes": "Static response log; row ordering preserved"},
        "mastery_score": {"source_type": "DERIVED", "derivation": "Laplace-smoothed topic accuracy strictly prior to interaction (shift 1)"},
        "session_id": {"source_type": "MISSING", "notes": "No session telemetry in MathE"}
    }

    def __init__(self, source_path: Optional[Path] = None):
        default_path = Path("datasets/raw/mathe/MathE dataset (4).csv")
        super().__init__("MathE", source_path or default_path)

    def load(self, source_path: Optional[Path] = None) -> pd.DataFrame:
        """Loads MathE raw CSV using latin1 encoding and semicolon separator."""
        path = source_path or self.source_path
        if not path or not path.exists():
            raise FileNotFoundError(f"MathE raw file not found at: {path}")

        # Raw file is read without modifying the original
        raw_df = pd.read_csv(path, sep=";", encoding="latin1")
        return raw_df

    def validate(self, raw_data: Any) -> bool:
        """Validates expected MathE columns and non-empty rows."""
        if not isinstance(raw_data, pd.DataFrame):
            return False
        required_cols = [
            "Student ID", "Question ID", "Type of Answer",
            "Question Level", "Topic", "Subtopic"
        ]
        return all(col in raw_data.columns for col in required_cols) and len(raw_data) > 0

    def inspect(self, raw_data: Any) -> Dict[str, Any]:
        """Deep inspection of MathE dataset."""
        df = raw_data if isinstance(raw_data, pd.DataFrame) else self.load()
        return {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "columns": list(df.columns),
            "unique_students": int(df["Student ID"].nunique()),
            "unique_questions": int(df["Question ID"].nunique()),
            "unique_topics": int(df["Topic"].nunique()),
            "unique_subtopics": int(df["Subtopic"].nunique()),
            "missing_values": df.isnull().sum().to_dict(),
            "duplicate_full_rows": int(df.duplicated().sum()),
            "duplicate_student_question_pairs": int(df.duplicated(subset=["Student ID", "Question ID"]).sum()),
            "accuracy_distribution": df["Type of Answer"].value_counts(normalize=True).to_dict(),
            "question_levels": df["Question Level"].value_counts().to_dict(),
        }

    def clean(self, raw_data: Any) -> pd.DataFrame:
        """
        Cleans data types without altering raw files:
        - Casts IDs and categorical levels
        - Sanitizes strings
        """
        df = raw_data.copy()
        df["Student ID"] = df["Student ID"].astype(int)
        df["Question ID"] = df["Question ID"].astype(int)
        df["Type of Answer"] = df["Type of Answer"].astype(int)
        df["Topic"] = df["Topic"].astype(str).str.strip()
        df["Subtopic"] = df["Subtopic"].astype(str).str.strip()
        df["Question Level"] = df["Question Level"].astype(str).str.strip()
        return df

    def map_schema(self, cleaned_df: pd.DataFrame) -> pd.DataFrame:
        """Maps MathE columns to canonical representation."""
        mapped = pd.DataFrame()
        mapped["student_id"] = "mathe_s_" + cleaned_df["Student ID"].astype(str)
        mapped["course_id"] = None
        mapped["module_id"] = "mathe_mod_" + cleaned_df["Subtopic"].str.lower().str.replace(r'[^a-z0-9]+', '_', regex=True).str.strip('_')
        mapped["topic_id"] = "mathe_top_" + cleaned_df["Topic"].str.lower().str.replace(r'[^a-z0-9]+', '_', regex=True).str.strip('_')
        mapped["question_id"] = "mathe_q_" + cleaned_df["Question ID"].astype(str)

        # Map Difficulty Level
        difficulty_map = {"Basic": 0.35, "Advanced": 0.75}
        mapped["question_difficulty"] = cleaned_df["Question Level"].map(difficulty_map).fillna(0.50)

        mapped["answer_correct"] = cleaned_df["Type of Answer"].clip(0, 1)
        mapped["time_taken_seconds"] = None
        mapped["hints_used"] = None
        mapped["timestamp"] = None
        mapped["session_id"] = None

        # Demographic / Metadata preservation
        mapped["raw_country"] = cleaned_df["Student Country"]
        mapped["raw_keywords"] = cleaned_df["Keywords"]
        return mapped

    def transform(self, mapped_df: pd.DataFrame) -> pd.DataFrame:
        """
        Computes rolling, strictly anti-leakage sequential features:
        - attempt_number
        - previous_attempts
        - previous_accuracy
        - recent_accuracy
        - mastery_score
        """
        df = mapped_df.copy()

        # 1. Attempt numbers per (student, question)
        df["attempt_number"] = df.groupby(["student_id", "question_id"]).cumcount() + 1
        df["previous_attempts"] = df["attempt_number"] - 1

        # 2. Sequential historical accuracy prior to current question (shift 1)
        # Global student previous accuracy
        student_history = df.groupby("student_id")["answer_correct"]
        prior_correct_cum = student_history.shift(1).fillna(0)
        prior_attempts_cum = student_history.cumcount()  # 0 on first item

        # Expanding mean with shift 1
        df["previous_accuracy"] = (
            student_history.apply(lambda s: s.shift(1).expanding().mean())
            .reset_index(level=0, drop=True)
            .fillna(0.50)  # Uninformative prior for first interaction
        )

        # 3. Rolling 5-item recent accuracy prior to current question
        df["recent_accuracy"] = (
            student_history.apply(lambda s: s.shift(1).rolling(window=5, min_periods=1).mean())
            .reset_index(level=0, drop=True)
            .fillna(0.50)
        )

        # 4. Topic mastery prior to current interaction (Bayesian Laplace smoothing)
        topic_history = df.groupby(["student_id", "topic_id"])["answer_correct"]
        topic_prior_correct = topic_history.apply(lambda s: s.shift(1).fillna(0).cumsum()).reset_index(level=[0, 1], drop=True)
        topic_prior_attempts = topic_history.cumcount()
        # Laplace smoothed mastery: (correct + 1) / (attempts + 2)
        df["mastery_score"] = ((topic_prior_correct + 1.0) / (topic_prior_attempts + 2.0)).round(4)

        return df

    def export(self, df: pd.DataFrame, output_dir: Path, formats: List[str] = ["parquet", "csv"]) -> Dict[str, str]:
        """Exports normalized MathE data into Parquet and CSV."""
        output_dir.mkdir(parents=True, exist_ok=True)
        saved_paths = {}

        if "parquet" in formats:
            parquet_path = output_dir / "mathe_normalized.parquet"
            df.to_parquet(parquet_path, index=False)
            saved_paths["parquet"] = str(parquet_path)

        if "csv" in formats:
            csv_path = output_dir / "mathe_normalized.csv"
            df.to_csv(csv_path, index=False)
            saved_paths["csv"] = str(csv_path)

        self._metadata["is_normalized"] = True
        self._metadata["record_count"] = len(df)
        self._metadata["exported_files"] = saved_paths
        return saved_paths
