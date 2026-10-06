"""
Dataset Inspector Module
Deep exploratory inspection of raw and normalized datasets.
"""

from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np

from .config import DATASET_SPECS, RAW_DIR, PROCESSED_DIR
from app.preprocessing.adapters.mathe_adapter import MathEAdapter
from app.preprocessing.adapters.ednet_adapter import EdNetKT1Adapter


def inspect_dataset(dataset_key: str) -> Dict[str, Any]:
    """Runs deep inspection on specified dataset."""
    if dataset_key == "mathe":
        adapter = MathEAdapter()
        raw_df = adapter.load()
        spec = DATASET_SPECS["mathe"]
        return {
            "dataset": "mathe",
            "name": spec["name"],
            "license": spec["license"],
            "raw_file": str(adapter.source_path),
            "file_size_bytes": adapter.source_path.stat().st_size,
            "total_rows": len(raw_df),
            "total_files": 1,
            "columns": list(raw_df.columns),
            "data_types": {col: str(dtype) for col, dtype in raw_df.dtypes.items()},
            "unique_students": int(raw_df["Student ID"].nunique()),
            "unique_questions": int(raw_df["Question ID"].nunique()),
            "unique_topics": int(raw_df["Topic"].nunique()),
            "unique_subtopics": int(raw_df["Subtopic"].nunique()),
            "missing_values": {col: int(raw_df[col].isnull().sum()) for col in raw_df.columns},
            "duplicate_full_rows": int(raw_df.duplicated().sum()),
            "duplicate_student_question_pairs": int(raw_df.duplicated(subset=["Student ID", "Question ID"]).sum()),
            "class_balance_accuracy": {
                str(k): float(v) for k, v in raw_df["Type of Answer"].value_counts(normalize=True).items()
            },
            "difficulty_level_distribution": {
                str(k): int(v) for k, v in raw_df["Question Level"].value_counts().items()
            },
            "topics": raw_df["Topic"].value_counts().to_dict(),
            "temporal_range": "STATIC_RESPONSES (No timestamps)",
        }

    elif dataset_key == "ednet_kt1":
        adapter = EdNetKT1Adapter()
        spec = DATASET_SPECS["ednet_kt1"]
        zip_path = Path(adapter.source_path)
        q_df = adapter.load_questions_metadata()

        # Check if normalized cohort exists
        norm_parquet = PROCESSED_DIR / "ednet_kt1" / "ednet_kt1_normalized.parquet"
        has_norm = norm_parquet.exists()
        norm_stats = {}
        if has_norm:
            df_norm = pd.read_parquet(norm_parquet)
            norm_stats = {
                "cohort_interactions": len(df_norm),
                "cohort_students": int(df_norm["student_id"].nunique()),
                "cohort_questions": int(df_norm["question_id"].nunique()),
                "cohort_accuracy": float(df_norm["answer_correct"].mean()),
                "cohort_time_mean_seconds": float(df_norm["time_taken_seconds"].dropna().mean()),
                "cohort_time_median_seconds": float(df_norm["time_taken_seconds"].dropna().median()),
                "cohort_timestamp_min": str(df_norm["timestamp"].dropna().min()),
                "cohort_timestamp_max": str(df_norm["timestamp"].dropna().max()),
                "cohort_duplicate_interactions": int(df_norm.duplicated(subset=["student_id", "question_id"]).sum()),
            }

        return {
            "dataset": "ednet_kt1",
            "name": spec["name"],
            "license": spec["license"],
            "raw_archive": str(zip_path),
            "file_size_bytes": zip_path.stat().st_size if zip_path.exists() else 0,
            "total_files": 784310,
            "total_student_files": 784309,
            "total_questions_metadata": len(q_df),
            "unique_toeic_parts": sorted(q_df["part"].unique().tolist()),
            "unique_tags": int(q_df["tags"].nunique()),
            "raw_columns_student_file": ["timestamp", "solving_id", "question_id", "user_answer", "elapsed_time"],
            "normalized_cohort": norm_stats
        }

    else:
        spec = DATASET_SPECS.get(dataset_key, {})
        return {
            "dataset": dataset_key,
            "name": spec.get("name", dataset_key),
            "status": spec.get("status", "REQUIRES_MANUAL_DOWNLOAD"),
            "license": spec.get("license"),
            "notes": spec.get("instructions")
        }
