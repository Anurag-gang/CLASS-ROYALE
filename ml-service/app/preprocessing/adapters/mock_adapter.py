"""
Mock Dataset Adapter for Testing and Development Verification
Normalizes sample or synthetic educational logs into canonical StudentInteraction format.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
import pandas as pd

from app.preprocessing.adapters.base_adapter import DatasetAdapter
from app.preprocessing.cleaners import DataCleaner
from app.schemas.interaction import StudentInteraction


class MockDatasetAdapter(DatasetAdapter):
    """
    Mock adapter used during unit testing and architecture validation.
    Maps legacy/external field names (user_id -> student_id, item_id -> question_id, is_correct -> answer_correct)
    into the canonical schema.
    """

    def __init__(self, source_path: Optional[Path] = None):
        super().__init__(dataset_name="MockEducationDataset", source_path=source_path)
        self.cleaner = DataCleaner()

    def load(self, source_path: Optional[Path] = None) -> pd.DataFrame:
        path = source_path or self.source_path
        if not path or not Path(path).exists():
            # Return in-memory test data
            return pd.DataFrame([
                {
                    "user_id": "test_s1",
                    "concept_id": "binary-trees",
                    "item_id": "q101",
                    "is_correct": 1,
                    "elapsed_time": 42.5,
                    "hints": 0,
                    "event_time": "2026-10-01T10:00:00Z",
                },
                {
                    "user_id": "test_s1",
                    "concept_id": "binary-trees",
                    "item_id": "q102",
                    "is_correct": 0,
                    "elapsed_time": 75.0,
                    "hints": 2,
                    "event_time": "2026-10-01T10:05:00Z",
                },
            ])
        return pd.read_csv(path)

    def validate(self, raw_df: pd.DataFrame) -> bool:
        required = ["user_id", "concept_id", "item_id", "is_correct"]
        return all(col in raw_df.columns for col in required)

    def map_schema(self, raw_df: pd.DataFrame) -> pd.DataFrame:
        df = raw_df.copy()
        rename_map = {
            "user_id": "student_id",
            "concept_id": "topic_id",
            "item_id": "question_id",
            "is_correct": "answer_correct",
            "elapsed_time": "time_taken_seconds",
            "hints": "hints_used",
            "event_time": "timestamp",
        }
        df = df.rename(columns=rename_map)

        if "attempt_number" not in df.columns:
            df["attempt_number"] = 1
        if "source_type" not in df.columns:
            df["source_type"] = "SYNTHETIC"

        return df

    def clean(self, mapped_df: pd.DataFrame) -> pd.DataFrame:
        return self.cleaner.clean_dataframe(mapped_df)

    def transform(self, cleaned_df: pd.DataFrame) -> List[StudentInteraction]:
        interactions: List[StudentInteraction] = []
        for _, row in cleaned_df.iterrows():
            ts = row.get("timestamp")
            if isinstance(ts, str):
                try:
                    parsed_ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except ValueError:
                    parsed_ts = datetime.now(timezone.utc)
            elif isinstance(ts, datetime):
                parsed_ts = ts
            else:
                parsed_ts = datetime.now(timezone.utc)

            interaction = StudentInteraction(
                student_id=str(row["student_id"]),
                topic_id=str(row["topic_id"]),
                question_id=str(row["question_id"]),
                attempt_number=int(row.get("attempt_number", 1)),
                answer_correct=bool(row["answer_correct"]),
                time_taken_seconds=float(row["time_taken_seconds"]) if pd.notna(row.get("time_taken_seconds")) else None,
                hints_used=int(row["hints_used"]) if pd.notna(row.get("hints_used")) else 0,
                timestamp=parsed_ts,
                source_type="SYNTHETIC",
            )
            interactions.append(interaction)
        return interactions

    def inspect(self, raw_data=None):
        df = raw_data if isinstance(raw_data, pd.DataFrame) else self.load()
        return {"rows": len(df), "columns": list(df.columns)}

    def export(self, df: pd.DataFrame, output_dir: Path, formats: List[str] = ["csv"]):
        output_dir.mkdir(parents=True, exist_ok=True)
        path = output_dir / "mock_normalized.csv"
        df.to_csv(path, index=False)
        return {"csv": str(path)}
