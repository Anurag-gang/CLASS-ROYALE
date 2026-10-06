"""
Weak Topic Classifier Training Pipeline
Trains 3-class models (WEAK / NORMAL / STRONG) on student-topic performance summaries.
Evaluates Macro F1, Precision, and Recall using student-level group splitting.
"""

import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd

from app.models.weak_topic_classifier import WeakTopicClassifier, WeakTopicBaseline
from app.registry.model_registry import ModelRegistry
from evaluation.metrics import ClassificationEvaluator
from training.common import BaseTrainer, student_group_split

logger = logging.getLogger("class_royale.ml.training.topic_classifier")


class TopicClassifierTrainer(BaseTrainer):
    """Trains 3-class classifier (STRONG/NORMAL/WEAK) for syllabus topics."""

    FEATURE_COLS = [
        "topic_accuracy",
        "recent_accuracy",
        "total_attempts",
        "consecutive_wrong",
        "average_time_seconds",
    ]

    def __init__(self, registry: ModelRegistry):
        super().__init__(model_name="weak_topic_classifier", registry=registry)
        self.baseline = WeakTopicBaseline()

    def prepare_data(self, dataset_path: Path) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Loads interaction log and aggregates into (student, topic) summary records."""
        if str(dataset_path).endswith(".parquet"):
            df = pd.read_parquet(dataset_path)
        else:
            df = pd.read_csv(dataset_path)

        logger.info(f"Aggregating {len(df):,} interaction rows into student-topic records...")
        
        # Calculate consecutive wrong per student-topic
        records = []
        for (sid, tid), group in df.groupby(["student_id", "topic_id"]):
            sorted_group = group.sort_values(by="attempt_number") if "attempt_number" in group.columns else group
            answers = sorted_group["answer_correct"].tolist()
            
            # Count trailing wrong answers
            consec_wrong = 0
            for a in reversed(answers):
                if a == 0:
                    consec_wrong += 1
                else:
                    break

            acc = float(np.mean(answers))
            recent_acc = float(np.mean(answers[-5:])) if len(answers) >= 5 else acc
            latency = float(group["time_taken_seconds"].mean()) if "time_taken_seconds" in group.columns and group["time_taken_seconds"].notna().any() else 25.0

            # Pedagogical 3-class target: 0=WEAK, 1=NORMAL, 2=STRONG
            if consec_wrong >= 3 or acc < 0.50:
                label = 0  # WEAK
            elif acc >= 0.75 and len(answers) >= 3:
                label = 2  # STRONG
            else:
                label = 1  # NORMAL

            records.append({
                "student_id": sid,
                "topic_id": tid,
                "topic_accuracy": acc,
                "recent_accuracy": recent_acc,
                "total_attempts": len(answers),
                "consecutive_wrong": consec_wrong,
                "average_time_seconds": latency,
                "target_class": label,
            })

        summary_df = pd.DataFrame(records)
        logger.info(f"Generated {len(summary_df):,} student-topic summary instances.")
        return student_group_split(summary_df, student_col="student_id", test_size=0.20, val_size=0.15)

    def build_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        X_df = df[self.FEATURE_COLS].copy()
        X_df["topic_accuracy"] = X_df["topic_accuracy"].fillna(0.50).astype(float)
        X_df["recent_accuracy"] = X_df["recent_accuracy"].fillna(0.50).astype(float)
        X_df["total_attempts"] = X_df["total_attempts"].fillna(1).astype(float)
        X_df["consecutive_wrong"] = X_df["consecutive_wrong"].fillna(0).astype(float)
        X_df["average_time_seconds"] = X_df["average_time_seconds"].fillna(25.0).clip(0, 300).astype(float)

        X = X_df.to_numpy(dtype=np.float64)
        y = df["target_class"].astype(int).to_numpy()
        return X, y, self.FEATURE_COLS

    def train_and_compare_candidates(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        feature_names: List[str],
    ) -> WeakTopicClassifier:
        candidates = ["logistic_regression", "random_forest", "gradient_boosting"]
        best_candidate: Optional[WeakTopicClassifier] = None
        best_val_f1 = -1.0

        for algo in candidates:
            logger.info(f"Training weak topic candidate: {algo}...")
            model = WeakTopicClassifier(model_version="v1.0.0", algorithm_name=algo)
            model.fit(X_train, y_train, feature_names=feature_names)

            val_preds = model.predict(X_val)
            val_probs = model.predict_proba(X_val)

            metrics = ClassificationEvaluator.evaluate(y_val, val_preds, val_probs, average="macro")
            self.evaluation_results[algo] = metrics
            logger.info(f"  {algo} -> Val Accuracy: {metrics['accuracy']:.4f}, Macro F1: {metrics['f1_score']:.4f}, Precision: {metrics['precision']:.4f}")

            if metrics["f1_score"] > best_val_f1:
                best_val_f1 = metrics["f1_score"]
                best_candidate = model

        self.best_model = best_candidate
        return best_candidate or WeakTopicClassifier()

    def evaluate_test_set(
        self,
        model: WeakTopicClassifier,
        X_test: np.ndarray,
        y_test: np.ndarray,
    ) -> Dict[str, Any]:
        preds = model.predict(X_test)
        probs = model.predict_proba(X_test)
        return ClassificationEvaluator.evaluate(y_test, preds, probs, average="macro")

    def train_pipeline(self, dataset_path: Path, version: str = "v1.0.0") -> Dict[str, Any]:
        train_df, val_df, test_df = self.prepare_data(dataset_path)

        X_train, y_train, feat_names = self.build_features(train_df)
        X_val, y_val, _ = self.build_features(val_df)
        X_test, y_test, _ = self.build_features(test_df)

        best_model = self.train_and_compare_candidates(X_train, y_train, X_val, y_val, feat_names)
        test_metrics = self.evaluate_test_set(best_model, X_test, y_test)

        # Baseline evaluation on test set
        base_preds = []
        for i in range(len(X_test)):
            b_res = self.baseline.predict(
                topic_accuracy=X_test[i, 0],
                recent_topic_accuracy=X_test[i, 1],
                total_attempts=int(X_test[i, 2]),
                consecutive_wrong=int(X_test[i, 3]),
            )
            b_map = {"WEAK": 0, "NORMAL": 1, "STRONG": 2}
            base_preds.append(b_map.get(b_res["status"].value, 1))

        base_metrics = ClassificationEvaluator.evaluate(y_test, np.array(base_preds), average="macro")
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
        logger.info(f"Weak topic classifier {version} ({best_model.algorithm_name}) saved to {saved_path}")

        return {
            "model_name": self.model_name,
            "version": version,
            "best_algorithm": best_model.algorithm_name,
            "test_metrics": test_metrics,
            "all_results": self.evaluation_results,
            "artifact_path": str(saved_path),
        }
