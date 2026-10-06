"""
Dataset Adapter Architecture
Base interface enabling dataset-agnostic ingestion of heterogeneous educational datasets
into the canonical Class Royale StudentInteraction schema.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd


class DatasetAdapter(ABC):
    """
    Abstract adapter interface for converting external educational datasets into
    the normalized Class Royale internal data contract.
    """

    def __init__(self, dataset_name: str, source_path: Optional[Path] = None):
        self.dataset_name = dataset_name
        self.source_path = source_path
        self._metadata: Dict[str, Any] = {
            "dataset_name": dataset_name,
            "adapter_version": "1.0.0",
            "is_normalized": False,
        }

    @abstractmethod
    def load(self, source_path: Optional[Path] = None) -> Any:
        """Loads raw dataset files without in-place modification."""
        pass

    @abstractmethod
    def validate(self, raw_data: Any) -> bool:
        """Validates that necessary raw columns exist and structure is intact."""
        pass

    @abstractmethod
    def inspect(self, raw_data: Any) -> Dict[str, Any]:
        """Calculates exploratory metrics (rows, counts, missing values, duplicates, distributions)."""
        pass

    @abstractmethod
    def clean(self, raw_data: Any) -> pd.DataFrame:
        """Cleans missing records, trims impossible values, and sanitizes datatypes."""
        pass

    @abstractmethod
    def map_schema(self, cleaned_df: pd.DataFrame) -> pd.DataFrame:
        """Maps dataset-specific column names to canonical schema columns."""
        pass

    @abstractmethod
    def transform(self, mapped_df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculates sequential leak-free features (attempt_number, previous_accuracy, recent_accuracy)
        and outputs canonical normalized DataFrame.
        """
        pass

    @abstractmethod
    def export(self, df: pd.DataFrame, output_dir: Path, formats: List[str] = ["parquet", "csv"]) -> Dict[str, str]:
        """Exports normalized data into Parquet and/or CSV files in output_dir."""
        pass

    def metadata(self) -> Dict[str, Any]:
        """Returns metadata regarding this adapter and normalized outputs."""
        return self._metadata
