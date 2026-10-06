"""
Student Mastery Prediction Endpoint
"""

from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_predictor_service
from app.inference.predictor import MLPredictorService
from app.schemas.mastery import MasteryRequest, MasteryResponse

router = APIRouter(prefix="/predict", tags=["Mastery Prediction"])


@router.post("/mastery", response_model=MasteryResponse)
def predict_student_mastery(
    request: MasteryRequest,
    force_baseline: bool = Query(default=False, description="Explicitly use Bayesian baseline even if ML model is active"),
    predictor: MLPredictorService = Depends(get_predictor_service),
) -> MasteryResponse:
    """
    Estimates a student's mastery score (0.0 to 1.0) on a target engineering topic.
    Returns status=MODEL_NOT_TRAINED when running in placeholder mode without fake scores.
    """
    return predictor.predict_mastery(request, force_baseline=force_baseline)
