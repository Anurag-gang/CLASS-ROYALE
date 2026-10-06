"""
Weak Topic Classification Schemas
Identifies syllabus topics requiring intervention (STRONG, NORMAL, WEAK).
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from .common import BaseMLResponse, TopicStatus
from .interaction import StudentInteraction


class TopicEvaluationInput(BaseModel):
    """Aggregate or interaction data for a specific topic."""
    topic_id: str = Field(..., description="Topic identifier")
    topic_accuracy: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Overall topic accuracy")
    recent_topic_accuracy: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Recent 5-attempt accuracy")
    total_attempts: Optional[int] = Field(default=None, ge=0, description="Total attempts in topic")
    consecutive_wrong: Optional[int] = Field(default=None, ge=0, description="Recent consecutive wrong answers")
    average_time_seconds: Optional[float] = Field(default=None, ge=0.0, description="Average response latency")


class TopicClassificationRequest(BaseModel):
    """Input payload for classifying topic mastery states for a student."""
    student_id: str = Field(..., description="Anonymized student ID")
    topics: Optional[List[TopicEvaluationInput]] = Field(
        default=None,
        description="Pre-aggregated topic performance metrics"
    )
    recent_interactions: Optional[List[StudentInteraction]] = Field(
        default=None,
        description="Raw recent interactions across syllabus for automatic grouping"
    )


class TopicStatusResult(BaseModel):
    """Classification result for a single topic."""
    topic_id: str
    status: TopicStatus = Field(..., description="Classification: STRONG, NORMAL, WEAK")
    confidence: float = Field(default=0.85, ge=0.0, le=1.0, description="Prediction confidence")
    topic_accuracy: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    attempts_count: Optional[int] = Field(default=None, ge=0)
    intervention_recommended: bool = Field(default=False, description="True if status is WEAK or declining rapidly")
    reasons: List[str] = Field(default_factory=list, description="Human/pedagogical explainability reasons")


class TopicClassificationResponse(BaseMLResponse):
    """Response payload containing classified topics and identified weak areas."""
    student_id: str
    topics: List[TopicStatusResult] = Field(default_factory=list)
    weak_topics: List[str] = Field(default_factory=list, description="Convenience list of topic IDs classified as WEAK")
