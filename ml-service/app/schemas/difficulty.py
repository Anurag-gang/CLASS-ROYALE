"""
Question Difficulty Prediction Schemas
Supports both student-specific P(correct|student, question) and global calibrated difficulty.
"""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from .common import BaseMLResponse, DifficultyLevel


class DifficultyRequest(BaseModel):
    """Input payload for estimating question difficulty and success probability."""
    question_id: str = Field(..., description="Unique question identifier")
    topic_id: Optional[str] = Field(default=None, description="Topic of the question")
    student_id: Optional[str] = Field(default=None, description="Student ID for personalized difficulty estimation")

    # Student context if available
    student_mastery: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Current student topic mastery")
    student_recent_accuracy: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Student recent accuracy")
    historical_question_accuracy: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Global historical pass rate across all students if known"
    )
    total_question_attempts: Optional[int] = Field(default=None, ge=0, description="Global question attempts count")


class DifficultyPrediction(BaseModel):
    """Output prediction for difficulty estimation."""
    success_probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="P(student answers correctly | student context, question)"
    )
    predicted_difficulty: DifficultyLevel = Field(
        ...,
        description="Categorical band: EASY (P>=0.75), MEDIUM (0.40<=P<0.75), HARD (P<0.40)"
    )
    is_student_specific: bool = Field(
        default=True,
        description="Whether prediction factored in individual student mastery or is global"
    )
    confidence: float = Field(default=0.85, ge=0.0, le=1.0, description="Confidence in the probability estimate")
    contributing_factors: Dict[str, Any] = Field(
        default_factory=dict,
        description="Explainability: baseline accuracy, student offset, feature contributions"
    )


class DifficultyResponse(BaseMLResponse):
    """Response payload for question difficulty prediction."""
    question_id: str
    prediction: Optional[DifficultyPrediction] = None
