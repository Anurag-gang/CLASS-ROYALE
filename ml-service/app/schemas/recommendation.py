"""
Next Question Recommendation Schemas
Candidate question representation and ranked question recommendations.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from .common import BaseMLResponse, DifficultyLevel


class QuestionCandidate(BaseModel):
    """Candidate question metadata submitted for ranking."""
    question_id: str = Field(..., description="Unique question identifier")
    topic_id: str = Field(..., description="Topic identifier")
    module_id: Optional[str] = Field(default=None, description="Module identifier")
    difficulty: Optional[float] = Field(default=0.5, ge=0.0, le=1.0, description="Calibrated difficulty 0.0-1.0")
    difficulty_level: Optional[DifficultyLevel] = Field(default=DifficultyLevel.MEDIUM)
    prerequisites: List[str] = Field(default_factory=list, description="Prerequisite topic/concept IDs")
    times_seen_by_student: int = Field(default=0, ge=0, description="Number of times student previously attempted this question")
    last_answered_correct: Optional[bool] = Field(default=None, description="Last attempt outcome if attempted")


class RecommendationRequest(BaseModel):
    """Input payload for ranking next questions to present to a student."""
    student_id: str = Field(..., description="Student identifier")
    topic_id: Optional[str] = Field(default=None, description="Optional target focus topic")
    candidate_questions: List[QuestionCandidate] = Field(..., min_length=1, description="Pool of questions available to select from")

    student_mastery: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Current student topic mastery")
    weak_topics: Optional[List[str]] = Field(default=None, description="Optional weak topics to target")
    target_difficulty: Optional[DifficultyLevel] = Field(default=None, description="Desired difficulty zone (e.g. MEDIUM for flow state)")
    exclude_question_ids: List[str] = Field(default_factory=list, description="Question IDs to filter out (e.g. current question)")
    top_k: int = Field(default=3, ge=1, le=20, description="Number of top questions to return")


class RankedQuestion(BaseModel):
    """A scored and ranked question recommendation."""
    question_id: str
    topic_id: str
    score: float = Field(..., description="Ranking score (higher = better pedagogical fit)")
    rank: int = Field(..., ge=1, description="Rank index (1 = top recommendation)")
    predicted_success_probability: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    difficulty_level: Optional[DifficultyLevel] = None
    rationale: str = Field(..., description="Pedagogical explanation for this recommendation")


class RecommendationResponse(BaseMLResponse):
    """Response payload containing ranked question recommendations."""
    student_id: str
    ranked_questions: List[RankedQuestion] = Field(default_factory=list)
    top_question_id: Optional[str] = None
