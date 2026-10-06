"""
Feature Scaling Transformers for Educational Telemetry
Provides robust scaling resilient to long response latency tails and outlier attempts.
"""

from typing import Dict, List, Optional
import numpy as np


class RobustTelemetryScaler:
    """
    Robust scaler using median and Interquartile Range (IQR).
    Preferred over standard z-score for educational telemetry because response latencies
    and attempt counts frequently exhibit heavy right-skewed log-normal distributions.
    """

    def __init__(self, feature_names: Optional[List[str]] = None):
        self.feature_names = feature_names or []
        self.medians_: Dict[str, float] = {}
        self.iqrs_: Dict[str, float] = {}
        self.is_fitted: bool = False

    def fit(self, X: np.ndarray, feature_names: Optional[List[str]] = None) -> "RobustTelemetryScaler":
        if feature_names:
            self.feature_names = feature_names

        X_arr = np.asarray(X, dtype=np.float64)
        n_features = X_arr.shape[1] if X_arr.ndim > 1 else 1

        if not self.feature_names:
            self.feature_names = [f"f_{i}" for i in range(n_features)]

        for i, col in enumerate(self.feature_names):
            vals = X_arr[:, i] if X_arr.ndim > 1 else X_arr
            med = float(np.nanmedian(vals))
            q25 = float(np.nanpercentile(vals, 25))
            q75 = float(np.nanpercentile(vals, 75))
            iqr = q75 - q25
            self.medians_[col] = med
            self.iqrs_[col] = iqr if iqr > 1e-6 else 1.0

        self.is_fitted = True
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            return np.asarray(X, dtype=np.float64)

        X_arr = np.asarray(X, dtype=np.float64).copy()
        if X_arr.ndim == 1:
            X_arr = X_arr.reshape(1, -1)

        for i, col in enumerate(self.feature_names):
            med = self.medians_.get(col, 0.0)
            iqr = self.iqrs_.get(col, 1.0)
            X_arr[:, i] = (X_arr[:, i] - med) / iqr

        return X_arr

    def fit_transform(self, X: np.ndarray, feature_names: Optional[List[str]] = None) -> np.ndarray:
        return self.fit(X, feature_names).transform(X)
