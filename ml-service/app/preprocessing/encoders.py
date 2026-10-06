"""
Categorical and Topic Feature Encoders
Provides deterministic mapping and safe handling for unseen categories during inference.
"""

from typing import Dict, List, Optional
import numpy as np
import pandas as pd


class CategoricalEncoder:
    """
    Ordinal / vocabulary encoder with dedicated out-of-vocabulary (OOV) index.
    Prevents KeyErrors when students encounter newly added syllabus topics or question types.
    """

    def __init__(self, oov_token: str = "<OOV>"):
        self.oov_token = oov_token
        self.vocab_: Dict[str, int] = {oov_token: 0}
        self.inverse_vocab_: Dict[int, str] = {0: oov_token}
        self.is_fitted: bool = False

    def fit(self, categories: List[str]) -> "CategoricalEncoder":
        """Fits vocabulary from distinct category strings."""
        unique_cats = sorted(list(set(str(c) for c in categories if pd.notna(c))))
        self.vocab_ = {self.oov_token: 0}
        for idx, cat in enumerate(unique_cats, start=1):
            self.vocab_[cat] = idx

        self.inverse_vocab_ = {v: k for k, v in self.vocab_.items()}
        self.is_fitted = True
        return self

    def transform(self, categories: List[str]) -> np.ndarray:
        """Transforms list of category strings to integer indices."""
        indices = [self.vocab_.get(str(c), 0) for c in categories]
        return np.array(indices, dtype=np.int64)

    def fit_transform(self, categories: List[str]) -> np.ndarray:
        return self.fit(categories).transform(categories)

    def inverse_transform(self, indices: List[int]) -> List[str]:
        return [self.inverse_vocab_.get(int(idx), self.oov_token) for idx in indices]

    def get_vocab_size(self) -> int:
        return len(self.vocab_)


class DifficultyLevelEncoder:
    """Encodes categorical difficulty bands (EASY, MEDIUM, HARD) to/from numeric values."""

    MAP = {
        "EASY": 0.25,
        "MEDIUM": 0.55,
        "HARD": 0.85,
    }

    @classmethod
    def encode(cls, level_str: str) -> float:
        clean = (level_str or "").strip().upper()
        return cls.MAP.get(clean, 0.5)

    @classmethod
    def decode(cls, score: float) -> str:
        if score < 0.40:
            return "HARD"  # low success probability = hard question
        elif score < 0.75:
            return "MEDIUM"
        return "EASY"
