"""
Training Framework and Group-Aware Splitting Utilities
Ensures leak-free evaluation via Student-Level Grouped Splitting and Chronological Splitting.
"""

from abc import ABC, abstractmethod
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit, TimeSeriesSplit

from app.models.base import BaseMLModel
from app.registry.model_registry import ModelRegistry
from app.registry.store import ModelArtifactStore, JoblibArtifactStore

logger = logging.getLogger("class_royale.ml.training")


def student_group_split(
    df: pd.DataFrame,
    student_col: str = "student_id",
    test_size: float = 0.20,
    val_size: float = 0.15,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Performs Student-Level Group Splitting (Train / Validation / Test).

    WHY THIS SPLIT STRATEGY IS MANDATORY:
    Standard random row-level k-fold cross validation causes massive target leakage in educational
    modeling because interactions from the SAME student appear across both train and test sets.
    The model easily memorizes individual student ability instead of learning generalizable
    pedagogical response patterns.
    """
    if df[student_col].nunique() < 3:
        # Fallback for tiny synthetic dev datasets
        n = len(df)
        train_end = int(n * 0.7)
        val_end = int(n * 0.85)
        return df.iloc[:train_end], df.iloc[train_end:val_end], df.iloc[val_end:]

    # First split: Train+Val vs Test
    gss_test = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=random_state)
    train_val_idx, test_idx = next(gss_test.split(df, groups=df[student_col]))

    train_val_df = df.iloc[train_val_idx].copy()
    test_df = df.iloc[test_idx].copy()

    # Second split: Train vs Validation
    relative_val_size = val_size / (1.0 - test_size)
    gss_val = GroupShuffleSplit(n_splits=1, test_size=relative_val_size, random_state=random_state)
    train_idx, val_idx = next(gss_val.split(train_val_df, groups=train_val_df[student_col]))

    train_df = train_val_df.iloc[train_idx].copy()
    val_df = train_val_df.iloc[val_idx].copy()

    logger.info(
        f"Group split complete: Train={len(train_df)} rows ({train_df[student_col].nunique()} students), "
        f"Val={len(val_df)} rows ({val_df[student_col].nunique()} students), "
        f"Test={len(test_df)} rows ({test_df[student_col].nunique()} students)"
    )
    return train_df, val_df, test_df


def chronological_split(
    df: pd.DataFrame,
    timestamp_col: str = "timestamp",
    test_size: float = 0.20,
    val_size: float = 0.15,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Chronological Splitting for time-dependent prediction tasks.
    Ensures model is trained on past interactions and evaluated on strictly future interactions.
    """
    df_sorted = df.sort_values(by=timestamp_col).reset_index(drop=True)
    n = len(df_sorted)

    train_end = int(n * (1.0 - test_size - val_size))
    val_end = int(n * (1.0 - test_size))

    train_df = df_sorted.iloc[:train_end].copy()
    val_df = df_sorted.iloc[train_end:val_end].copy()
    test_df = df_sorted.iloc[val_end:].copy()

    return train_df, val_df, test_df


# Section 16 Interface Aliases
group_train_test_split = student_group_split
temporal_train_test_split = chronological_split


class BaseTrainer(ABC):
    """
    Standardized trainer interface enforcing:
    load_data -> validate_data -> split_data -> build_features -> train_candidates -> evaluate -> select_model -> save
    """

    def __init__(
        self,
        model_name: str,
        registry: ModelRegistry,
        store: Optional[ModelArtifactStore] = None,
    ):
        self.model_name = model_name
        self.registry = registry
        self.store = store or JoblibArtifactStore(registry.registry_dir)
        self.best_model: Optional[BaseMLModel] = None
        self.evaluation_results: Dict[str, Any] = {}

    @abstractmethod
    def prepare_data(self, dataset_path: Path) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        pass

    @abstractmethod
    def build_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        pass

    @abstractmethod
    def train_and_compare_candidates(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        feature_names: List[str],
    ) -> BaseMLModel:
        """Trains multiple candidate algorithms and selects the best validated model."""
        pass

    def save_artifact(self, model: BaseMLModel, version: str, metadata: Dict[str, Any]) -> Path:
        target_path = self.registry.get_artifact_path(self.model_name, version)
        saved_path = self.store.save(model, target_path, metadata)
        self.registry.register_metadata(
            model_name=self.model_name,
            version=version,
            algorithm=model.algorithm_name,
            is_trained=True,
            training_dataset=metadata.get("dataset"),
            validation_metrics=metadata.get("validation_metrics", {}),
            test_metrics=metadata.get("test_metrics", {}),
            hyperparameters=model.metadata.get("hyperparameters", {}),
        )
        return saved_path
