"""
Adaptive Learning Orchestration and Unified Student Profile Schemas
Contracts for Class Royale Next-Action Decisions and Student Profile Predictions.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from .common import BaseMLResponse, LearningAction
from .mastery import MasteryScore
from .difficulty import DifficultyPrediction
from .topic import TopicStatusResult
from .recommendation import QuestionCandidate
from .interaction import StudentInteraction


class AdaptiveActionRequest(BaseModel):
    """Input payload for orchestrating the next adaptive learning step."""
    student_id: str = Field(..., description="Student identifier")
    topic_id: str = Field(..., description="Current topic ID")
    current_question_id: Optional[str] = Field(default=None, description="Question just answered")
    last_answer_correct: Optional[bool] = Field(default=None, description="Outcome of the last attempt")
    consecutive_correct: Optional[int] = Field(default=None, ge=0)
    consecutive_wrong: Optional[int] = Field(default=None, ge=0)
    time_taken_seconds: Optional[float] = Field(default=None, ge=0.0)

    recent_interactions: Optional[List[StudentInteraction]] = Field(
        default=None,
        description="Chronological recent interaction history"
    )
    available_questions: Optional[List[QuestionCandidate]] = Field(
        default=None,
        description="Pool of candidate questions for immediate recommendation"
    )


class AdaptiveActionResponse(BaseMLResponse):
    """
    Unified pedagogical decision emitted by AdaptiveLearningEngine.
    Combines mastery estimation, topic status, difficulty prediction, and question recommendation.
    """
    student_id: str
    topic_id: str
    action: LearningAction = Field(..., description="Prescribed learning action")
    action_rationale: str = Field(..., description="Pedagogical explanation for the action decision")

    mastery: Optional[MasteryScore] = None
    topic_status: Optional[TopicStatusResult] = None
    question_prediction: Optional[DifficultyPrediction] = None
    recommended_question_ids: List[str] = Field(default_factory=list)

    model_versions: Dict[str, str] = Field(
        default_factory=dict,
        description="Versions of all models contributing to this decision"
    )


class StudentProfilePredictionRequest(BaseModel):
    """Input payload to evaluate student across all topics."""
    student_id: str = Field(..., description="Student identifier")
    interactions: List[StudentInteraction] = Field(..., min_length=1, description="Student interaction history")


class StudentProfilePredictionResponse(BaseMLResponse):
    """Full student mastery profile across the engineering syllabus."""
    student_id: str
    overall_mastery: float = Field(..., ge=0.0, le=1.0)
    topic_masteries: Dict[str, float] = Field(default_factory=dict, description="Topic ID -> Mastery score (0.0-1.0)")
    weak_topics: List[str] = Field(default_factory=list)
    strong_topics: List[str] = Field(default_factory=list)
    recommended_action: LearningAction = Field(default=LearningAction.ANSWER_NEXT_QUESTION)
    model_versions: Dict[str, str] = Field(default_factory=dict)
