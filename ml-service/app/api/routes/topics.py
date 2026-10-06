"""
Weak Topic Classification Endpoint
"""

from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_predictor_service
from app.inference.predictor import MLPredictorService
from app.schemas.topic import TopicClassificationRequest, TopicClassificationResponse

router = APIRouter(prefix="/predict", tags=["Topic Classification"])


@router.post("/topic", response_model=TopicClassificationResponse)
def classify_student_topics(
    request: TopicClassificationRequest,
    force_baseline: bool = Query(default=False, description="Force rule-based threshold baseline"),
    predictor: MLPredictorService = Depends(get_predictor_service),
) -> TopicClassificationResponse:
    """
    Classifies syllabus topics for a student into STRONG, NORMAL, and WEAK categories
    to pinpoint learning bottlenecks and trigger pedagogical interventions.
    """
    return predictor.classify_topics(request, force_baseline=force_baseline)
