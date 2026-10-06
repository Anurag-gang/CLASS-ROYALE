"""
Class Royale Machine Learning Engine — Unified Model Training Runner
Phase 3: Model Training & Evaluation Pipeline

Trains, compares candidates, evaluates against classical pedagogical baselines,
and registers versioned production artifacts for:
  1. Student Topic Mastery Predictor (MasteryPredictor)
  2. Question Difficulty & Pass-Rate Predictor (QuestionDifficultyPredictor)
  3. Weak Topic Classifier (WeakTopicClassifier)
  4. Next Question Recommender Engine (QuestionRecommender)

Uses student-level group splitting (GroupShuffleSplit) to strictly prevent target leakage.
"""

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Dict, Any

# Ensure ml-service root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config.settings import settings
from app.registry.model_registry import ModelRegistry
from app.registry.store import JoblibArtifactStore
from training.train_mastery import MasteryTrainer
from training.train_difficulty import DifficultyTrainer
from training.train_topic_classifier import TopicClassifierTrainer
from training.train_recommender import RecommenderTrainer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("class_royale.ml.training.runner")


def run_training_pipeline(
    version: str = "v1.0.0",
    mathe_path: Path = Path("datasets/processed/mathe/mathe_normalized.parquet"),
    questions_path: Path = Path("datasets/raw/ednet/contents/contents/questions.csv"),
) -> Dict[str, Any]:
    """Runs all 4 training pipelines and records candidate metrics."""
    registry_dir = settings.resolve_path(settings.model_registry_path)
    store = JoblibArtifactStore(registry_dir)
    registry = ModelRegistry(registry_dir=registry_dir, store=store)

    results: Dict[str, Any] = {}

    print("\n" + "=" * 80)
    print(f"CLASS ROYALE ML ENGINE — TRAINING PIPELINE [{version}]")
    print("=" * 80)
    print(f"Registry Directory : {registry_dir}")
    print(f"Primary Training DB: {mathe_path}")
    print(f"Questions Catalog  : {questions_path}")
    print("=" * 80 + "\n")

    # 1. Student Topic Mastery
    print(">>> [1/4] Training Student Topic Mastery Predictor...")
    mastery_trainer = MasteryTrainer(registry)
    mastery_res = mastery_trainer.train_pipeline(mathe_path, version=version)
    results["mastery_predictor"] = mastery_res
    print(f"    Winner: {mastery_res['best_algorithm']}")
    print(f"    Test Accuracy: {mastery_res['test_metrics']['accuracy']:.4f} | Test AUC: {mastery_res['test_metrics'].get('roc_auc', 0):.4f}")
    print(f"    Saved: {mastery_res['artifact_path']}\n")

    # 2. Question Difficulty & Pass-Rate
    print(">>> [2/4] Training Question Difficulty Predictor...")
    difficulty_trainer = DifficultyTrainer(registry)
    diff_res = difficulty_trainer.train_pipeline(mathe_path, version=version)
    results["question_difficulty_predictor"] = diff_res
    print(f"    Winner: {diff_res['best_algorithm']}")
    print(f"    Test Brier: {diff_res['test_metrics']['brier_score']:.4f} | Test Acc: {diff_res['test_metrics']['accuracy']:.4f}")
    print(f"    Saved: {diff_res['artifact_path']}\n")

    # 3. Weak Topic Classifier
    print(">>> [3/4] Training Weak Topic Classifier (3-Class)...")
    topic_trainer = TopicClassifierTrainer(registry)
    topic_res = topic_trainer.train_pipeline(mathe_path, version=version)
    results["weak_topic_classifier"] = topic_res
    print(f"    Winner: {topic_res['best_algorithm']}")
    print(f"    Test Macro F1: {topic_res['test_metrics']['f1_score']:.4f} | Test Acc: {topic_res['test_metrics']['accuracy']:.4f}")
    print(f"    Saved: {topic_res['artifact_path']}\n")

    # 4. Next Question Recommender
    print(">>> [4/4] Calibrating Question Recommender (ZPD Flow)...")
    rec_trainer = RecommenderTrainer(registry)
    rec_res = rec_trainer.train_pipeline(questions_path, version=version)
    results["question_recommender"] = rec_res
    print(f"    NDCG@5: {rec_res['metrics']['ndcg_at_5']:.4f} | Precision@5: {rec_res['metrics']['precision_at_5']:.4f}")
    print(f"    Saved: {rec_res['artifact_path']}\n")

    print("=" * 80)
    print("ALL 4 MODEL ARTIFACTS SUCCESSFULLY TRAINED, EVALUATED, AND REGISTERED!")
    print("=" * 80)

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Class Royale ML Model Training Runner")
    parser.add_argument("--version", type=str, default="v1.0.0", help="Model version tag")
    parser.add_argument(
        "--dataset",
        type=str,
        default="datasets/processed/mathe/mathe_normalized.parquet",
        help="Path to normalized interaction parquet dataset",
    )
    args = parser.parse_args()

    run_training_pipeline(version=args.version, mathe_path=Path(args.dataset))
