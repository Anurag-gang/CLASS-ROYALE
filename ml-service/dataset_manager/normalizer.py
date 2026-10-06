"""
Dataset Normalizer Module
Coordinates schema mapping, validation, and serialization to Parquet/CSV.
"""

from pathlib import Path
from typing import Dict, Any, Optional

from .config import DATASET_SPECS, PROCESSED_DIR
from app.preprocessing.adapters.mathe_adapter import MathEAdapter
from app.preprocessing.adapters.ednet_adapter import EdNetKT1Adapter


def normalize_dataset(dataset_key: str, **kwargs) -> Dict[str, Any]:
    """Normalizes specified raw dataset into canonical Class Royale representation."""
    if dataset_key == "mathe":
        adapter = MathEAdapter()
        raw_df = adapter.load()
        if not adapter.validate(raw_df):
            raise ValueError("MathE dataset validation failed.")
        
        cleaned = adapter.clean(raw_df)
        mapped = adapter.map_schema(cleaned)
        transformed = adapter.transform(mapped)
        out_dir = PROCESSED_DIR / "mathe"
        saved = adapter.export(transformed, out_dir, formats=["parquet", "csv"])

        return {
            "dataset": "mathe",
            "status": "NORMALIZED",
            "total_records": len(transformed),
            "unique_students": int(transformed["student_id"].nunique()),
            "unique_questions": int(transformed["question_id"].nunique()),
            "exported_files": saved
        }

    elif dataset_key == "ednet_kt1":
        adapter = EdNetKT1Adapter()
        cohort_size = kwargs.get("cohort_students", 500)
        chunk_size = kwargs.get("chunk_size", 250)
        out_dir = PROCESSED_DIR / "ednet_kt1"
        res = adapter.normalize_cohort(out_dir, cohort_students=cohort_size, chunk_size=chunk_size)
        return {
            "dataset": "ednet_kt1",
            "status": "NORMALIZED",
            "total_records": res["total_interactions"],
            "total_students": res["total_students"],
            "partitions_count": len(res["partitions"]),
            "combined_file": res["combined_file"]
        }

    else:
        raise ValueError(f"Normalization not supported or dataset unavailable: '{dataset_key}'")


def normalize_all() -> Dict[str, Any]:
    """Runs normalization across all acquired datasets."""
    results = {}
    results["mathe"] = normalize_dataset("mathe")
    results["ednet_kt1"] = normalize_dataset("ednet_kt1", cohort_students=500)
    return results
