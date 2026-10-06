"""
Question Difficulty Model Training & Calibration Pipeline
Trains candidate algorithms (Logistic Regression, Random Forest, Gradient Boosting)
to calibrate success probability P(correct | student, question) and difficulty bands.
"""

import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd

from app.models.difficulty_predictor import QuestionDifficultyPredictor, DifficultyBaseline
from app.registry.model_registry import ModelRegistry
from evaluation.metrics import ClassificationEvaluator, ProbabilityCalibrationEvaluator
from training.common import BaseTrainer, student_group_split

logger = logging.getLogger("class_royale.ml.training.difficulty")


class DifficultyTrainer(BaseTrainer):
    """Trains and compares candidate algorithms for question difficulty and success prediction."""

    FEATURE_COLS = [
        "question_difficulty",
        "previous_accuracy",
        "recent_accuracy",
        "attempt_number",
        "time_taken_seconds",
    ]

    def __init__(self, registry: ModelRegistry):
        super().__init__(model_name="question_difficulty_predictor", registry=registry)
        self.baseline = DifficultyBaseline()

    def prepare_data(self, dataset_path: Path) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Loads data and splits by student group to prevent leakage."""
        if str(dataset_path).endswith(".parquet"):
            df = pd.read_parquet(dataset_path)
        else:
            df = pd.read_csv(dataset_path)

        logger.info(f"Loaded {len(df):,} interaction rows for difficulty calibration.")
        return student_group_split(df, student_col="student_id", test_size=0.20, val_size=0.15)

    def build_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """Constructs leak-free feature matrix for difficulty prediction."""
        X_df = pd.DataFrame(index=df.index)
        X_df["question_difficulty"] = df["question_difficulty"].fillna(0.50).astype(float)
        X_df["previous_accuracy"] = df["previous_accuracy"].fillna(0.50).astype(float)
        X_df["recent_accuracy"] = df["recent_accuracy"].fillna(0.50).astype(float)
        X_df["attempt_number"] = df["attempt_number"].fillna(1).astype(float)
        X_df["time_taken_seconds"] = df["time_taken_seconds"].fillna(25.0).clip(0, 300).astype(float)

        X = X_df.to_numpy(dtype=np.float64)
        y = df["answer_correct"].astype(int).to_numpy()
        return X, y, self.FEATURE_COLS

    def train_and_compare_candidates(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        feature_names: List[str],
    ) -> QuestionDifficultyPredictor:
        candidates = ["logistic_regression", "random_forest", "gradient_boosting"]
        best_candidate: Optional[QuestionDifficultyPredictor] = None
        best_val_brier = 999.0  # Lower Brier score is superior probability calibration

        for algo in candidates:
            logger.info(f"Training difficulty candidate: {algo}...")
            model = QuestionDifficultyPredictor(model_version="v1.0.0", algorithm_name=algo)
            model.fit(X_train, y_train, feature_names=feature_names)

            val_preds = model.predict(X_val)
            val_probs = model.predict_proba(X_val)

            cls_metrics = ClassificationEvaluator.evaluate(y_val, val_preds, val_probs)
            cal_metrics = ProbabilityCalibrationEvaluator.evaluate(y_val, val_probs)

            metrics = {**cls_metrics, **cal_metrics}
            self.evaluation_results[algo] = metrics
            logger.info(f"  {algo} -> Val Brier: {metrics['brier_score']:.4f}, Accuracy: {metrics['accuracy']:.4f}, AUC: {metrics.get('roc_auc', 0):.4f}")

            if metrics["brier_score"] < best_val_brier:
                best_val_brier = metrics["brier_score"]
                best_candidate = model

        self.best_model = best_candidate
        return best_candidate or QuestionDifficultyPredictor()

    def evaluate_test_set(
        self,
        model: QuestionDifficultyPredictor,
        X_test: np.ndarray,
        y_test: np.ndarray,
    ) -> Dict[str, Any]:
        preds = model.predict(X_test)
        probs = model.predict_proba(X_test)
        cls_metrics = ClassificationEvaluator.evaluate(y_test, preds, probs)
        cal_metrics = ProbabilityCalibrationEvaluator.evaluate(y_test, probs)
        return {**cls_metrics, **cal_metrics}

    def train_pipeline(self, dataset_path: Path, version: str = "v1.0.0") -> Dict[str, Any]:
        train_df, val_df, test_df = self.prepare_data(dataset_path)

        X_train, y_train, feat_names = self.build_features(train_df)
        X_val, y_val, _ = self.build_features(val_df)
        X_test, y_test, _ = self.build_features(test_df)

        best_model = self.train_and_compare_candidates(X_train, y_train, X_val, y_val, feat_names)
        test_metrics = self.evaluate_test_set(best_model, X_test, y_test)

        # Baseline evaluation on test set
        base_probs = np.full_like(y_test, fill_value=float(np.mean(y_train)), dtype=float)
        base_preds = (base_probs >= 0.50).astype(int)
        base_metrics = ClassificationEvaluator.evaluate(y_test, base_preds, base_probs)
        base_metrics.update(ProbabilityCalibrationEvaluator.evaluate(y_test, base_probs))
        self.evaluation_results["baseline"] = base_metrics

        metadata = {
            "validation_metrics": self.evaluation_results.get(best_model.algorithm_name, {}),
            "test_metrics": test_metrics,
            "all_candidate_metrics": self.evaluation_results,
            "training_samples": len(X_train),
            "validation_samples": len(X_val),
            "test_samples": len(X_test),
            "feature_names": feat_names,
            "algorithm": best_model.algorithm_name,
            "dataset": str(dataset_path.name),
        }

        saved_path = self.save_artifact(best_model, version, metadata)
        logger.info(f"Difficulty model {version} ({best_model.algorithm_name}) saved to {saved_path}")

        return {
            "model_name": self.model_name,
            "version": version,
            "best_algorithm": best_model.algorithm_name,
            "test_metrics": test_metrics,
            "all_results": self.evaluation_results,
            "artifact_path": str(saved_path),
        }
