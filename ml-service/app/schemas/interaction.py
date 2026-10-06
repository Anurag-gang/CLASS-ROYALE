"""
Canonical Student Interaction Data Contract
Dataset-agnostic schema for student learning events in Class Royale.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator
from .common import FeatureType


# Feature Role Metadata Definition
INTERACTION_FEATURE_METADATA: Dict[str, FeatureType] = {
    "student_id": FeatureType.RAW,
    "course_id": FeatureType.OPTIONAL,
    "module_id": FeatureType.OPTIONAL,
    "topic_id": FeatureType.RAW,
    "question_id": FeatureType.RAW,
    "question_difficulty": FeatureType.OPTIONAL,
    "attempt_number": FeatureType.RAW,
    "previous_attempts": FeatureType.DERIVED,
    "previous_accuracy": FeatureType.DERIVED,
    "recent_accuracy": FeatureType.DERIVED,
    "time_taken_seconds": FeatureType.OPTIONAL,
    "hints_used": FeatureType.OPTIONAL,
    "answer_correct": FeatureType.TARGET,  # Primary target for performance prediction
    "timestamp": FeatureType.RAW,
    "mastery_score": FeatureType.TARGET,  # Target for mastery regression/classification
    "session_id": FeatureType.OPTIONAL,
    "source_type": FeatureType.RAW,
}


class StudentInteraction(BaseModel):
    """
    Canonical normalized learning event representation.
    External educational datasets (EdNet, ASSISTments, OULAD, etc.) are mapped into this schema.
    """
    student_id: str = Field(..., description="Unique student identifier (anonymized, non-PII)")
    course_id: Optional[str] = Field(default=None, description="Course identifier (e.g. CS-201)")
    module_id: Optional[str] = Field(default=None, description="Module/Chapter identifier")
    topic_id: str = Field(..., description="Topic identifier (e.g. binary-search-trees)")
    question_id: str = Field(..., description="Question identifier")

    question_difficulty: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Global calibrated difficulty score (0.0=easiest, 1.0=hardest) or None if uncalibrated"
    )

    attempt_number: int = Field(default=1, ge=1, description="Sequential attempt index for this question")
    previous_attempts: Optional[int] = Field(default=None, ge=0, description="Total prior question attempts across topic")
    previous_accuracy: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Historical accuracy prior to this event")
    recent_accuracy: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Rolling accuracy over last 5 attempts")

    time_taken_seconds: Optional[float] = Field(default=None, ge=0.0, description="Response time in seconds")
    hints_used: Optional[int] = Field(default=None, ge=0, description="Count of pedagogical hints requested")

    answer_correct: bool = Field(..., description="Whether the student answered correctly on this attempt")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="UTC timestamp of interaction")

    mastery_score: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Ground-truth mastery label if evaluated, or None during regular inference"
    )
    session_id: Optional[str] = Field(default=None, description="Learning session identifier")

    source_type: str = Field(
        default="REAL",
        description="Lineage marker: REAL or SYNTHETIC (for development/testing only)"
    )

    @field_validator("source_type")
    @classmethod
    def validate_source_type(cls, v: str) -> str:
        clean = v.upper()
        if clean not in ("REAL", "SYNTHETIC"):
            raise ValueError("source_type must be either 'REAL' or 'SYNTHETIC'")
        return clean

    def to_feature_dict(self, exclude_targets: bool = True) -> Dict[str, Any]:
        """
        Converts interaction to dictionary while optionally stripping TARGET features
        to prevent accidental data leakage during feature generation.
        """
        data = self.model_dump()
        if exclude_targets:
            for field, role in INTERACTION_FEATURE_METADATA.items():
                if role == FeatureType.TARGET and field in data:
                    del data[field]
        return data


class StudentInteractionBatch(BaseModel):
    """Batch container for bulk telemetry ingestion and training workflows."""
    interactions: List[StudentInteraction] = Field(..., description="List of canonical interactions")
    dataset_name: Optional[str] = Field(default="internal_telemetry", description="Source dataset name")
    is_synthetic: bool = Field(default=False, description="Flag explicitly marking test/synthetic batches")
