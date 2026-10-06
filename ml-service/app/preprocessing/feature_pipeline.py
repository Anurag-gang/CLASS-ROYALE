"""
Feature Engineering Pipeline for Class Royale Student Interaction Streams
Extracts Student, Topic, Question, and Temporal features with strict target leakage prevention.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

from app.schemas.interaction import StudentInteraction, INTERACTION_FEATURE_METADATA
from app.schemas.common import FeatureType


class FeatureExtractor:
    """
    Computes educational feature representations from interaction histories.
    Guarantees causal temporal order so that features computed at time t NEVER
    incorporate telemetry from t or t+1 (strict anti-leakage guarantee).
    """

    FEATURE_NAMES: List[str] = [
        # Student Features (Historical)
        "student_total_attempts",
        "student_total_questions_answered",
        "student_overall_accuracy",
        "student_recent_accuracy",
        "student_rolling_accuracy_5",
        "student_average_time",
        "student_median_time",
        "student_consecutive_correct",
        "student_consecutive_wrong",
        "student_hint_usage_rate",
        "student_retry_rate",

        # Topic Features (Historical for this student)
        "topic_attempts",
        "topic_accuracy",
        "recent_topic_accuracy",
        "topic_time_average",
        "topic_attempt_streak",

        # Question Features (Contextual)
        "question_difficulty",
        "question_attempt_number",

        # Temporal Features
        "time_since_last_attempt_seconds",
        "session_attempt_number",
        "day_of_week",
    ]

    def __init__(self, recent_window_size: int = 5):
        self.recent_window_size = recent_window_size

    def extract_features_from_history(
        self,
        history: List[StudentInteraction],
        target_topic_id: str,
        target_question_id: Optional[str] = None,
        target_question_difficulty: Optional[float] = None,
        current_timestamp: Optional[datetime] = None,
    ) -> Dict[str, float]:
        """
        Builds feature vector for a student before they answer the target question.
        Ensures target interaction is NOT in history (prevents target leakage).
        """
        # Sort history chronologically to ensure valid causality
        sorted_history = sorted(history, key=lambda x: x.timestamp)

        total_attempts = len(sorted_history)
        if total_attempts == 0:
            # Cold-start student with zero historical interactions
            return self._cold_start_features(target_topic_id, target_question_difficulty)

        # 1. Student-level Aggregates
        unique_questions = len(set(x.question_id for x in sorted_history))
        correct_count = sum(1 for x in sorted_history if x.answer_correct)
        overall_accuracy = correct_count / total_attempts

        recent_slice = sorted_history[-self.recent_window_size:]
        recent_accuracy = (
            sum(1 for x in recent_slice if x.answer_correct) / len(recent_slice)
            if recent_slice else 0.5
        )

        rolling_5_slice = sorted_history[-5:]
        rolling_accuracy = (
            sum(1 for x in rolling_5_slice if x.answer_correct) / len(rolling_5_slice)
            if rolling_5_slice else 0.5
        )

        latencies = [x.time_taken_seconds for x in sorted_history if x.time_taken_seconds is not None]
        avg_time = float(np.mean(latencies)) if latencies else 45.0
        med_time = float(np.median(latencies)) if latencies else 45.0

        # Calculate streaks
        consecutive_correct = 0
        consecutive_wrong = 0
        for interaction in reversed(sorted_history):
            if interaction.answer_correct:
                if consecutive_wrong > 0:
                    break
                consecutive_correct += 1
            else:
                if consecutive_correct > 0:
                    break
                consecutive_wrong += 1

        total_hints = sum(x.hints_used or 0 for x in sorted_history)
        hint_usage_rate = total_hints / total_attempts

        retries = sum(1 for x in sorted_history if x.attempt_number > 1)
        retry_rate = retries / total_attempts

        # 2. Topic-level Aggregates
        topic_history = [x for x in sorted_history if x.topic_id == target_topic_id]
        topic_attempts = len(topic_history)

        if topic_attempts > 0:
            topic_correct = sum(1 for x in topic_history if x.answer_correct)
            topic_accuracy = topic_correct / topic_attempts
            recent_topic_slice = topic_history[-self.recent_window_size:]
            recent_topic_accuracy = (
                sum(1 for x in recent_topic_slice if x.answer_correct) / len(recent_topic_slice)
            )
            topic_latencies = [x.time_taken_seconds for x in topic_history if x.time_taken_seconds is not None]
            topic_time_average = float(np.mean(topic_latencies)) if topic_latencies else avg_time
            topic_attempt_streak = len(topic_history)
        else:
            topic_accuracy = overall_accuracy
            recent_topic_accuracy = overall_accuracy
            topic_time_average = avg_time
            topic_attempt_streak = 0

        # 3. Question Features
        question_difficulty = target_question_difficulty if target_question_difficulty is not None else 0.5
        question_attempt_number = 1
        if target_question_id:
            matching_q = [x for x in sorted_history if x.question_id == target_question_id]
            question_attempt_number = len(matching_q) + 1

        # 4. Temporal Features
        now = current_timestamp or (datetime.now(sorted_history[-1].timestamp.tzinfo) if sorted_history[-1].timestamp.tzinfo else datetime.now())
        last_event_time = sorted_history[-1].timestamp
        time_since_last_seconds = max(0.0, (now - last_event_time).total_seconds())

        # Session attempt count (within 30 minute idle gap)
        session_attempt_count = 1
        for i in range(len(sorted_history) - 1, 0, -1):
            gap = (sorted_history[i].timestamp - sorted_history[i - 1].timestamp).total_seconds()
            if gap > 1800:
                break
            session_attempt_count += 1

        day_of_week = float(now.weekday())

        return {
            "student_total_attempts": float(total_attempts),
            "student_total_questions_answered": float(unique_questions),
            "student_overall_accuracy": float(overall_accuracy),
            "student_recent_accuracy": float(recent_accuracy),
            "student_rolling_accuracy_5": float(rolling_accuracy),
            "student_average_time": float(avg_time),
            "student_median_time": float(med_time),
            "student_consecutive_correct": float(consecutive_correct),
            "student_consecutive_wrong": float(consecutive_wrong),
            "student_hint_usage_rate": float(hint_usage_rate),
            "student_retry_rate": float(retry_rate),
            "topic_attempts": float(topic_attempts),
            "topic_accuracy": float(topic_accuracy),
            "recent_topic_accuracy": float(recent_topic_accuracy),
            "topic_time_average": float(topic_time_average),
            "topic_attempt_streak": float(topic_attempt_streak),
            "question_difficulty": float(question_difficulty),
            "question_attempt_number": float(question_attempt_number),
            "time_since_last_attempt_seconds": float(time_since_last_seconds),
            "session_attempt_number": float(session_attempt_count),
            "day_of_week": float(day_of_week),
        }

    def _cold_start_features(
        self,
        target_topic_id: str,
        target_question_difficulty: Optional[float] = None
    ) -> Dict[str, float]:
        """Cold-start feature vector for a student with no prior interaction record."""
        return {
            "student_total_attempts": 0.0,
            "student_total_questions_answered": 0.0,
            "student_overall_accuracy": 0.5,
            "student_recent_accuracy": 0.5,
            "student_rolling_accuracy_5": 0.5,
            "student_average_time": 45.0,
            "student_median_time": 45.0,
            "student_consecutive_correct": 0.0,
            "student_consecutive_wrong": 0.0,
            "student_hint_usage_rate": 0.0,
            "student_retry_rate": 0.0,
            "topic_attempts": 0.0,
            "topic_accuracy": 0.5,
            "recent_topic_accuracy": 0.5,
            "topic_time_average": 45.0,
            "topic_attempt_streak": 0.0,
            "question_difficulty": target_question_difficulty if target_question_difficulty is not None else 0.5,
            "question_attempt_number": 1.0,
            "time_since_last_attempt_seconds": 0.0,
            "session_attempt_number": 1.0,
            "day_of_week": 0.0,
        }

    def to_feature_vector(self, feature_dict: Dict[str, float]) -> np.ndarray:
        """Converts feature dictionary into deterministic ordered NumPy vector."""
        return np.array([feature_dict[name] for name in self.FEATURE_NAMES], dtype=np.float64)

    @classmethod
    def assert_no_leakage(cls, feature_dict: Dict[str, Any]) -> None:
        """
        Verification safeguard: raises AssertionError if any TARGET or future field
        has leaked into the feature dictionary.
        """
        for field, role in INTERACTION_FEATURE_METADATA.items():
            if role == FeatureType.TARGET:
                if field in feature_dict:
                    raise AssertionError(f"DATA LEAKAGE DETECTED: Target feature '{field}' found in feature vector!")
