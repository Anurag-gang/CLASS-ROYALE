"""
Question Difficulty Prediction Endpoint
"""

from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_predictor_service
from app.inference.predictor import MLPredictorService
from app.schemas.difficulty import DifficultyRequest, DifficultyResponse

router = APIRouter(prefix="/predict", tags=["Difficulty Prediction"])


@router.post("/difficulty", response_model=DifficultyResponse)
def predict_question_difficulty(
    request: DifficultyRequest,
    force_baseline: bool = Query(default=False, description="Force item pass-rate baseline"),
    predictor: MLPredictorService = Depends(get_predictor_service),
) -> DifficultyResponse:
    """
    Estimates P(correct | student, question) and maps to difficulty band (EASY / MEDIUM / HARD).
    """
    return predictor.predict_difficulty(request, force_baseline=force_baseline)
