"""
Adaptive Learning Engine & Student Profile Endpoints
"""

from fastapi import APIRouter, Depends
from app.api.dependencies import get_adaptive_engine
from app.inference.adaptive_engine import AdaptiveLearningEngine
from app.schemas.adaptive import (
    AdaptiveActionRequest,
    AdaptiveActionResponse,
    StudentProfilePredictionRequest,
    StudentProfilePredictionResponse,
)

router = APIRouter(tags=["Adaptive Learning Orchestration"])


@router.post("/adaptive/next-action", response_model=AdaptiveActionResponse)
def determine_adaptive_next_action(
    request: AdaptiveActionRequest,
    engine: AdaptiveLearningEngine = Depends(get_adaptive_engine),
) -> AdaptiveActionResponse:
    """
    Orchestrates mastery, topic status, difficulty prediction, and question recommendation
    into a deterministic, explainable pedagogical next-action decision for Class Royale:
    - ANSWER_NEXT_QUESTION
    - REVISE_TOPIC
    - LOWER_DIFFICULTY
    - INCREASE_DIFFICULTY
    - PRACTICE_WEAK_TOPIC
    - REVIEW_CONCEPT
    - TAKE_BREAK
    """
    return engine.determine_next_action(request)


@router.post("/predict/student-profile", response_model=StudentProfilePredictionResponse)
def predict_student_profile(
    request: StudentProfilePredictionRequest,
    engine: AdaptiveLearningEngine = Depends(get_adaptive_engine),
) -> StudentProfilePredictionResponse:
    """
    Evaluates historical interaction logs across all syllabus topics to build a comprehensive
    mastery profile identifying strong disciplines and weak bottlenecks requiring intervention.
    """
    return engine.generate_student_profile(request)
