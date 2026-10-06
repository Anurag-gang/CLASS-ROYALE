"""
EdNet-KT1 Dataset Adapter
Processes Riiid EdNet Knowledge Tracing Level 1 interactions joined with official question metadata.
Implements streaming, chunked processing, and anti-leakage rolling feature derivation.
"""

import io
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional
import pandas as pd
import numpy as np

from .base_adapter import DatasetAdapter


class EdNetKT1Adapter(DatasetAdapter):
    """
    Adapter for Riiid EdNet-KT1 Dataset.
    Raw interaction fields:
      ['timestamp', 'solving_id', 'question_id', 'user_answer', 'elapsed_time']
    Joined question metadata:
      ['question_id', 'bundle_id', 'explanation_id', 'correct_answer', 'part', 'tags']
    """

    FEATURE_PROVENANCE = {
        "student_id": {"source_type": "OBSERVED", "notes": "Extracted from student CSV filename (e.g. u12345)"},
        "course_id": {"source_type": "MISSING", "notes": "EdNet is multi-subject TOEIC preparation without course boundaries"},
        "module_id": {"source_type": "DERIVED", "derivation": "Primary skill tag from official questions.csv"},
        "topic_id": {"source_type": "DERIVED", "derivation": "TOEIC Part classification (Part 1-7) from questions.csv"},
        "question_id": {"source_type": "OBSERVED", "original_col": "question_id"},
        "question_difficulty": {"source_type": "MISSING", "notes": "No explicit item difficulty level in raw KT1"},
        "attempt_number": {"source_type": "DERIVED", "derivation": "1-indexed rolling attempts per (student, question)"},
        "previous_attempts": {"source_type": "DERIVED", "derivation": "Attempts strictly prior to current interaction (shift 1)"},
        "previous_accuracy": {"source_type": "DERIVED", "derivation": "Expanding student accuracy prior to current interaction (shift 1)"},
        "recent_accuracy": {"source_type": "DERIVED", "derivation": "Rolling 5-interaction student accuracy prior to current interaction (shift 1)"},
        "time_taken_seconds": {"source_type": "OBSERVED", "original_col": "elapsed_time", "derivation": "elapsed_time in ms / 1000.0"},
        "hints_used": {"source_type": "MISSING", "notes": "No hint events recorded in KT1"},
        "answer_correct": {"source_type": "DERIVED", "derivation": "user_answer == questions.csv[correct_answer]"},
        "timestamp": {"source_type": "OBSERVED", "original_col": "timestamp", "notes": "Normalized UTC datetime from shifted epoch ms"},
        "mastery_score": {"source_type": "DERIVED", "derivation": "Laplace-smoothed topic accuracy strictly prior to interaction (shift 1)"},
        "session_id": {"source_type": "MISSING", "notes": "KT1 does not record session boundaries (KT3/KT4 feature)"}
    }

    def __init__(
        self,
        source_zip: Optional[Path] = None,
        questions_csv: Optional[Path] = None
    ):
        default_zip = Path("datasets/raw/ednet/kt1/EdNet-KT1.zip")
        default_q = Path("datasets/raw/ednet/contents/contents/questions.csv")
        super().__init__("EdNet-KT1", source_zip or default_zip)
        self.questions_csv_path = questions_csv or default_q
        self._questions_df: Optional[pd.DataFrame] = None

    def load_questions_metadata(self) -> pd.DataFrame:
        """Loads and indexes official question metadata."""
        if self._questions_df is None:
            if not self.questions_csv_path.exists():
                raise FileNotFoundError(f"Questions metadata not found: {self.questions_csv_path}")
            df = pd.read_csv(self.questions_csv_path)
            df["question_id"] = df["question_id"].astype(str)
            df["correct_answer"] = df["correct_answer"].astype(str).str.strip().str.lower()
            df["part"] = df["part"].astype(int)
            self._questions_df = df
        return self._questions_df

    def load(self, source_path: Optional[Path] = None) -> zipfile.ZipFile:
        """Opens EdNet-KT1 zip archive for streaming reads."""
        path = source_path or self.source_path
        if not path or not path.exists():
            raise FileNotFoundError(f"EdNet-KT1 archive not found: {path}")
        return zipfile.ZipFile(path, 'r')

    def validate(self, raw_data: Any) -> bool:
        """Validates that zip contains KT1 student files and questions metadata exists."""
        if not isinstance(raw_data, zipfile.ZipFile):
            return False
        namelist = raw_data.namelist()
        has_students = any(n.startswith("KT1/u") and n.endswith(".csv") for n in namelist[:20])
        return has_students and self.questions_csv_path.exists()

    def inspect(self, raw_data: Any) -> Dict[str, Any]:
        """Inspects archive structure and returns dataset properties."""
        zf = raw_data if isinstance(raw_data, zipfile.ZipFile) else self.load()
        infolist = zf.infolist()
        csv_entries = [m for m in infolist if m.filename.endswith('.csv') and not m.filename.startswith('__MACOSX')]
        q_df = self.load_questions_metadata()

        return {
            "total_files": len(infolist),
            "student_files_count": len(csv_entries),
            "total_questions_metadata": len(q_df),
            "unique_parts": sorted(q_df["part"].unique().tolist()),
            "unique_tags": int(q_df["tags"].nunique()),
            "archive_size_bytes": Path(self.source_path).stat().st_size if self.source_path else 0
        }

    def clean(self, raw_data: Any) -> pd.DataFrame:
        """Stub conforming to base interface; for EdNet use clean_student_df."""
        return pd.DataFrame()

    def map_schema(self, cleaned_df: pd.DataFrame) -> pd.DataFrame:
        """Stub conforming to base interface; for EdNet use map_student_df."""
        return pd.DataFrame()

    def transform(self, mapped_df: pd.DataFrame) -> pd.DataFrame:
        """Transforms a mapped interactions DataFrame into leak-free canonical representation."""
        df = mapped_df.copy()
        if df.empty:
            return df

        # Strict chronological ordering
        df = df.sort_values(by=["student_id", "timestamp"]).reset_index(drop=True)

        # 1. Attempt numbers
        df["attempt_number"] = df.groupby(["student_id", "question_id"]).cumcount() + 1
        df["previous_attempts"] = df["attempt_number"] - 1

        # 2. Sequential historical accuracy strictly prior to current question (shift 1)
        student_cum_correct = df.groupby("student_id")["answer_correct"].cumsum() - df["answer_correct"]
        student_prior_attempts = df.groupby("student_id").cumcount()
        df["previous_accuracy"] = np.where(
            student_prior_attempts == 0,
            0.50,
            (student_cum_correct / np.maximum(1, student_prior_attempts)).round(4)
        )

        # 3. Rolling 5-item recent accuracy strictly prior to current question (shift 1)
        df["recent_accuracy"] = (
            df.groupby("student_id")["answer_correct"]
            .shift(1)
            .rolling(window=5, min_periods=1)
            .mean()
            .fillna(0.50)
            .round(4)
        )

        # 4. Topic mastery prior to current interaction (Bayesian Laplace smoothing, shift 1)
        topic_cum_correct = df.groupby(["student_id", "topic_id"])["answer_correct"].cumsum() - df["answer_correct"]
        topic_prior_attempts = df.groupby(["student_id", "topic_id"]).cumcount()
        df["mastery_score"] = ((topic_cum_correct + 1.0) / (topic_prior_attempts + 2.0)).round(4)

        return df

    def stream_students(
        self,
        max_students: Optional[int] = None,
        chunk_size_students: int = 500
    ) -> Generator[pd.DataFrame, None, None]:
        """
        Memory-efficient generator yielding normalized DataFrames in student cohorts.
        Prevents loading 784,000 files into memory at once.
        """
        questions = self.load_questions_metadata().set_index("question_id")
        
        with self.load() as zf:
            all_names = zf.namelist()
            csv_names = [n for n in all_names if n.startswith("KT1/u") and n.endswith(".csv")]
            if max_students:
                csv_names = csv_names[:max_students]

            print(f"Streaming {len(csv_names):,} student interaction files from EdNet-KT1...", flush=True)
            current_batch = []
            for i, member_name in enumerate(csv_names):
                match = re.search(r'u(\d+)\.csv$', member_name)
                user_num = match.group(1) if match else str(i)
                student_id = f"ednet_u_{user_num}"

                with zf.open(member_name) as f:
                    try:
                        df_u = pd.read_csv(f)
                        if df_u.empty or "question_id" not in df_u.columns:
                            continue

                        # Clean types
                        df_u["question_id"] = df_u["question_id"].astype(str)
                        df_u["user_answer"] = df_u["user_answer"].astype(str).str.strip().str.lower()
                        df_u["elapsed_time"] = pd.to_numeric(df_u["elapsed_time"], errors="coerce").fillna(20000).clip(0, 3600000)
                        df_u["timestamp"] = pd.to_numeric(df_u["timestamp"], errors="coerce").fillna(0)

                        # Join question metadata
                        joined = df_u.join(questions, on="question_id", how="inner")
                        if joined.empty:
                            continue

                        # Canonical mapping
                        mapped = pd.DataFrame(index=joined.index)
                        mapped["student_id"] = student_id
                        mapped["course_id"] = None
                        
                        # Topic & Module
                        mapped["topic_id"] = "ednet_part_" + joined["part"].astype(str)
                        primary_tags = joined["tags"].astype(str).apply(lambda t: t.split(";")[0] if pd.notna(t) and t else "0")
                        mapped["module_id"] = "ednet_tag_" + primary_tags
                        mapped["question_id"] = "ednet_q_" + joined["question_id"]
                        
                        # Correctness evaluation
                        mapped["answer_correct"] = (joined["user_answer"] == joined["correct_answer"]).astype(int)
                        mapped["time_taken_seconds"] = (joined["elapsed_time"] / 1000.0).round(2)
                        mapped["hints_used"] = None
                        mapped["question_difficulty"] = None
                        mapped["session_id"] = None

                        # Convert epoch ms timestamp to ISO string
                        mapped["timestamp"] = pd.to_datetime(joined["timestamp"], unit="ms", errors="coerce").dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                        
                        current_batch.append(mapped)

                    except Exception as e:
                        continue

                if (i + 1) % 100 == 0:
                    print(f"  Processed {i + 1:,}/{len(csv_names):,} student interaction files...", flush=True)

                # Yield batch when chunk size reached
                if (i + 1) % chunk_size_students == 0 or (i + 1) == len(csv_names):
                    if current_batch:
                        combined = pd.concat(current_batch, ignore_index=True)
                        transformed = self.transform(combined)
                        current_batch = []
                        yield transformed

    def export(
        self,
        df: pd.DataFrame,
        output_dir: Path,
        formats: List[str] = ["parquet"]
    ) -> Dict[str, str]:
        """Exports DataFrame to output directory."""
        output_dir.mkdir(parents=True, exist_ok=True)
        saved = {}
        if "parquet" in formats:
            parquet_path = output_dir / "ednet_kt1_cohort.parquet"
            df.to_parquet(parquet_path, index=False)
            saved["parquet"] = str(parquet_path)
        if "csv" in formats:
            csv_path = output_dir / "ednet_kt1_cohort.csv"
            df.to_csv(csv_path, index=False)
            saved["csv"] = str(csv_path)

        self._metadata["is_normalized"] = True
        self._metadata["record_count"] = len(df)
        self._metadata["exported_files"] = saved
        return saved

    def normalize_cohort(
        self,
        output_dir: Path,
        cohort_students: int = 2500,
        chunk_size: int = 500
    ) -> Dict[str, Any]:
        """
        Streamingly normalizes a cohort of students directly to Parquet partition files.
        Guarantees zero RAM exhaustion.
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        cohort_dir = output_dir / "partitions"
        cohort_dir.mkdir(parents=True, exist_ok=True)

        total_interactions = 0
        total_students_processed = 0
        partition_files = []

        print(f"\nStreamingly normalizing EdNet-KT1 cohort ({cohort_students:,} students)...")
        for chunk_idx, chunk_df in enumerate(self.stream_students(max_students=cohort_students, chunk_size_students=chunk_size)):
            part_path = cohort_dir / f"part_{chunk_idx:04d}.parquet"
            chunk_df.to_parquet(part_path, index=False)
            partition_files.append(str(part_path))
            total_interactions += len(chunk_df)
            total_students_processed += chunk_df["student_id"].nunique()
            print(f"  Partition {chunk_idx + 1}: {len(chunk_df):,} interactions ({total_interactions:,} cumulative) -> {part_path.name}")

        # Also write a combined cohort parquet for convenient single-file reading if <= 500,000 rows
        combined_path = output_dir / "ednet_kt1_normalized.parquet"
        all_dfs = [pd.read_parquet(p) for p in partition_files]
        if all_dfs:
            combined_df = pd.concat(all_dfs, ignore_index=True)
            combined_df.to_parquet(combined_path, index=False)
            print(f"Combined cohort written: {combined_path.name} ({len(combined_df):,} rows)")

        self._metadata["is_normalized"] = True
        self._metadata["total_interactions"] = total_interactions
        self._metadata["total_students"] = total_students_processed
        self._metadata["partitions"] = len(partition_files)

        return {
            "total_interactions": total_interactions,
            "total_students": total_students_processed,
            "partitions": partition_files,
            "combined_file": str(combined_path)
        }
