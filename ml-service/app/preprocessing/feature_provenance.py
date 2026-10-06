"""
Feature Provenance & Leakage Risk Catalog
Documents source type (OBSERVED, DERIVED, MISSING), formula, leakage severity, and mitigation.
"""

from typing import Dict, Any

CANONICAL_FEATURE_PROVENANCE: Dict[str, Dict[str, Any]] = {
    "student_id": {
        "type": "IDENTIFIER",
        "source_type": "OBSERVED",
        "description": "Anonymized, research-specific student identifier.",
        "leakage_risk": "HIGH (if used directly as categorical feature across train/test)",
        "mitigation": "Must NEVER be used as a numerical feature. Must be used as grouping variable in GroupShuffleSplit."
    },
    "course_id": {
        "type": "CATEGORICAL",
        "source_type": "MISSING",
        "description": "University course context (e.g. CS-201).",
        "leakage_risk": "LOW",
        "mitigation": "Optional contextual feature; missing in EdNet and MathE."
    },
    "module_id": {
        "type": "CATEGORICAL",
        "source_type": "DERIVED",
        "description": "Curriculum subtopic or primary skill tag.",
        "derivation": "Slugified subtopic in MathE; primary TOEIC tag in EdNet.",
        "leakage_risk": "LOW",
        "mitigation": "Observed prior to question presentation."
    },
    "topic_id": {
        "type": "CATEGORICAL",
        "source_type": "OBSERVED / DERIVED",
        "description": "Broad pedagogical concept or TOEIC test part.",
        "derivation": "Directly observed in MathE; derived from part (1-7) in EdNet.",
        "leakage_risk": "LOW",
        "mitigation": "Static curriculum metadata; no target leakage."
    },
    "question_id": {
        "type": "IDENTIFIER",
        "source_type": "OBSERVED",
        "description": "Unique identifier of the question item.",
        "leakage_risk": "MEDIUM (target leakage if post-attempt question stats are aggregated over entire dataset including test)",
        "mitigation": "Global item statistics must be computed strictly on training split or prior historical batches."
    },
    "question_difficulty": {
        "type": "NUMERICAL",
        "source_type": "DERIVED / MISSING",
        "description": "Calibrated continuous difficulty between 0.0 (easiest) and 1.0 (hardest).",
        "derivation": "MathE mapped: Basic=0.35, Advanced=0.75; EdNet: global pass rate complement (1 - p).",
        "leakage_risk": "HIGH if derived using current or future student answers.",
        "mitigation": "Difficulty calibration uses historical baseline or static question level tags."
    },
    "attempt_number": {
        "type": "NUMERICAL",
        "source_type": "DERIVED",
        "description": "1-based rolling attempt number of the student on this specific question item.",
        "calculation": "df.groupby(['student_id', 'question_id']).cumcount() + 1",
        "leakage_risk": "LOW",
        "mitigation": "Calculated strictly in chronological order."
    },
    "previous_attempts": {
        "type": "NUMERICAL",
        "source_type": "DERIVED",
        "description": "Number of prior exposures to this question item.",
        "calculation": "attempt_number - 1",
        "leakage_risk": "LOW",
        "mitigation": "Uses strictly information prior to current attempt."
    },
    "previous_accuracy": {
        "type": "NUMERICAL",
        "source_type": "DERIVED",
        "description": "Cumulative historical accuracy of the student across all topics prior to this interaction.",
        "calculation": "cumsum(answer_correct, shift=1) / cumcount(attempts, shift=1)",
        "leakage_risk": "CRITICAL",
        "mitigation": "Must shift target by 1. Absolutely cannot include current answer_correct."
    },
    "recent_accuracy": {
        "type": "NUMERICAL",
        "source_type": "DERIVED",
        "description": "Rolling mean accuracy across the last 5 interactions prior to this interaction.",
        "calculation": "rolling(window=5, shift=1).mean()",
        "leakage_risk": "CRITICAL",
        "mitigation": "Must shift target by 1. Cannot include current answer_correct."
    },
    "time_taken_seconds": {
        "type": "NUMERICAL",
        "source_type": "OBSERVED / MISSING",
        "description": "Response latency in seconds.",
        "derivation": "EdNet: elapsed_time (ms) / 1000.0; MathE: MISSING.",
        "leakage_risk": "HIGH if predicting whether student will answer correctly BEFORE question is served; LOW if used for post-response mastery update.",
        "mitigation": "For difficulty prediction (pre-answer): excluded. For mastery estimation (post-answer): included."
    },
    "hints_used": {
        "type": "NUMERICAL",
        "source_type": "MISSING",
        "description": "Count of hint requests before final answer.",
        "leakage_risk": "MEDIUM",
        "mitigation": "Not recorded in EdNet KT1 or MathE."
    },
    "answer_correct": {
        "type": "TARGET",
        "source_type": "OBSERVED / DERIVED",
        "description": "Binary outcome: 1 if answer is correct, 0 if incorrect.",
        "derivation": "MathE: Type of Answer; EdNet: user_answer == correct_answer.",
        "leakage_risk": "TARGET (Primary prediction target).",
        "mitigation": "Excluded from feature inputs (X). Only used as ground truth (y)."
    },
    "timestamp": {
        "type": "TEMPORAL",
        "source_type": "OBSERVED / MISSING",
        "description": "UTC timestamp of the interaction event.",
        "derivation": "EdNet: ms timestamp converted to ISO 8601; MathE: sequential row index.",
        "leakage_risk": "HIGH if temporal leakage occurs (future events training past predictions).",
        "mitigation": "Enforced chronological sorting and temporal validation splits."
    },
    "mastery_score": {
        "type": "TARGET / DERIVED",
        "source_type": "DERIVED",
        "description": "Laplace-smoothed estimated student mastery in the target topic.",
        "calculation": "(prior_topic_correct + 1.0) / (prior_topic_attempts + 2.0)",
        "leakage_risk": "CRITICAL",
        "mitigation": "Strictly shifted by 1 so current question outcome does not leak into the prior mastery state."
    },
    "session_id": {
        "type": "IDENTIFIER",
        "source_type": "MISSING",
        "description": "Study session identifier.",
        "leakage_risk": "LOW",
        "mitigation": "Not present in EdNet KT1 or MathE."
    }
}
