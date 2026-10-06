"""
Class Royale Machine Learning Schemas Export
"""

from .common import (
    FeatureType,
    PredictionStatus,
    DifficultyLevel,
    TopicStatus,
    LearningAction,
    ModelMetadata,
    BaseMLResponse,
)
from .interaction import (
    StudentInteraction,
    StudentInteractionBatch,
    INTERACTION_FEATURE_METADATA,
)
from .mastery import MasteryRequest, MasteryScore, MasteryResponse
from .difficulty import DifficultyRequest, DifficultyPrediction, DifficultyResponse
from .topic import (
    TopicEvaluationInput,
    TopicClassificationRequest,
    TopicStatusResult,
    TopicClassificationResponse,
)
from .recommendation import (
    QuestionCandidate,
    RecommendationRequest,
    RankedQuestion,
    RecommendationResponse,
)
from .adaptive import (
    AdaptiveActionRequest,
    AdaptiveActionResponse,
    StudentProfilePredictionRequest,
    StudentProfilePredictionResponse,
)

__all__ = [
    "FeatureType",
    "PredictionStatus",
    "DifficultyLevel",
    "TopicStatus",
    "LearningAction",
    "ModelMetadata",
    "BaseMLResponse",
    "StudentInteraction",
    "StudentInteractionBatch",
    "INTERACTION_FEATURE_METADATA",
    "MasteryRequest",
    "MasteryScore",
    "MasteryResponse",
    "DifficultyRequest",
    "DifficultyPrediction",
    "DifficultyResponse",
    "TopicEvaluationInput",
    "TopicClassificationRequest",
    "TopicStatusResult",
    "TopicClassificationResponse",
    "QuestionCandidate",
    "RecommendationRequest",
    "RankedQuestion",
    "RecommendationResponse",
    "AdaptiveActionRequest",
    "AdaptiveActionResponse",
    "StudentProfilePredictionRequest",
    "StudentProfilePredictionResponse",
]
