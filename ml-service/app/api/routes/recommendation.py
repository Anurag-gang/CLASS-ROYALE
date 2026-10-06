"""
Question Recommendation Endpoint
"""

from fastapi import APIRouter, Depends
from app.api.dependencies import get_predictor_service
from app.inference.predictor import MLPredictorService
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse

router = APIRouter(prefix="/recommend", tags=["Question Recommendation"])


@router.post("/questions", response_model=RecommendationResponse)
def recommend_next_questions(
    request: RecommendationRequest,
    predictor: MLPredictorService = Depends(get_predictor_service),
) -> RecommendationResponse:
    """
    Ranks candidate questions to optimize student flow state, target weak concepts,
    and prevent repetitive question exposure.
    """
    return predictor.recommend_questions(request)
