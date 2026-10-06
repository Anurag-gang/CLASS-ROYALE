"""
Student Mastery Prediction Schemas
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from .common import BaseMLResponse, PredictionStatus
from .interaction import StudentInteraction


class MasteryRequest(BaseModel):
    """Input payload for estimating student topic mastery."""
    student_id: str = Field(..., description="Anonymized student identifier")
    topic_id: str = Field(..., description="Target engineering topic ID (e.g. data-structures-trees)")
    course_id: Optional[str] = Field(default=None, description="Optional course context")

    # Optional historical aggregates if interactions are already pre-aggregated
    historical_accuracy: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Overall historical accuracy")
    recent_accuracy: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Accuracy in the last 5-10 attempts")
    total_attempts: Optional[int] = Field(default=None, ge=0, description="Total attempts in this topic")
    consecutive_correct: Optional[int] = Field(default=None, ge=0, description="Current streak of correct answers")
    average_time_seconds: Optional[float] = Field(default=None, ge=0.0, description="Average response latency")

    # Or raw recent interactions for automatic feature derivation
    recent_interactions: Optional[List[StudentInteraction]] = Field(
        default=None,
        description="Chronological recent interaction telemetry"
    )


class MasteryScore(BaseModel):
    """Mastery prediction output with calibrated confidence and explainability."""
    score: float = Field(..., ge=0.0, le=1.0, description="Estimated mastery probability (0.0 to 1.0)")
    confidence: float = Field(default=0.85, ge=0.0, le=1.0, description="Epistemic/calibration confidence")
    algorithm_used: str = Field(default="baseline_historical", description="Algorithm that generated the estimate")
    contributing_factors: Dict[str, Any] = Field(
        default_factory=dict,
        description="Explainability breakdown: contributing feature values and weights"
    )


class MasteryResponse(BaseMLResponse):
    """Response payload for student mastery estimation."""
    student_id: str
    topic_id: str
    mastery: Optional[MasteryScore] = None
