"""
Unified Prediction Service
Coordinates feature engineering, model inference, placeholder mode, and baseline fallbacks.
"""

import logging
from typing import List, Optional
import numpy as np

from app.config.settings import settings
from app.inference.model_loader import ModelLoader
from app.models.mastery_predictor import MasteryPredictor, MasteryBaseline
from app.models.difficulty_predictor import QuestionDifficultyPredictor, DifficultyBaseline
from app.models.weak_topic_classifier import WeakTopicClassifier, WeakTopicBaseline
from app.models.question_recommender import QuestionRecommender, RecommenderBaseline
from app.preprocessing.feature_pipeline import FeatureExtractor
from app.schemas.common import PredictionStatus, DifficultyLevel, TopicStatus
from app.schemas.mastery import MasteryRequest, MasteryResponse, MasteryScore
from app.schemas.difficulty import DifficultyRequest, DifficultyResponse, DifficultyPrediction
from app.schemas.topic import TopicClassificationRequest, TopicClassificationResponse, TopicStatusResult
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse, RankedQuestion

logger = logging.getLogger("class_royale.ml.inference.predictor")


class MLPredictorService:
    """
    Central orchestration facade for all ML predictions.
    Honors ML_MODE=placeholder and DEMO_MODE=true strictly:
    Never disguises fake predictions as genuine trained machine learning outputs.
    """

    def __init__(self, loader: ModelLoader):
        self.loader = loader
        self.feature_extractor = FeatureExtractor()

        # Classical deterministic baselines for cold-start and academic benchmarking
        self.mastery_baseline = MasteryBaseline()
        self.difficulty_baseline = DifficultyBaseline()
        self.topic_baseline = WeakTopicBaseline()
        self.recommender_baseline = RecommenderBaseline()
        self.recommender_engine = QuestionRecommender()

    # =========================================================================
    # 1. STUDENT MASTERY PREDICTION
    # =========================================================================
    def predict_mastery(self, req: MasteryRequest, force_baseline: bool = False) -> MasteryResponse:
        version = settings.default_mastery_model_version
        model: Optional[MasteryPredictor] = self.loader.load_model("mastery_predictor", version)

        # Case A: Trained model available and active
        if model and model.is_trained and settings.ml_mode == "active" and not force_baseline:
            try:
                history = req.recent_interactions or []
                prev_acc = req.historical_accuracy
                rec_acc = req.recent_accuracy
                attempts = req.total_attempts
                latency = req.average_time_seconds

                if history:
                    topic_hist = [x for x in history if x.topic_id == req.topic_id] or history
                    if prev_acc is None:
                        prev_acc = sum(1 for x in topic_hist if x.answer_correct) / len(topic_hist)
                    if rec_acc is None:
                        rec_slice = topic_hist[-5:]
                        rec_acc = sum(1 for x in rec_slice if x.answer_correct) / len(rec_slice)
                    if attempts is None:
                        attempts = len(topic_hist)
                    if latency is None:
                        times = [x.time_taken_seconds for x in topic_hist if x.time_taken_seconds is not None]
                        latency = float(np.mean(times)) if times else 25.0

                prev_acc = float(prev_acc if prev_acc is not None else 0.50)
                rec_acc = float(rec_acc if rec_acc is not None else prev_acc)
                attempts = float((attempts or 0) + 1)
                latency = float(latency or 25.0)
                q_diff = 0.50

                vec = np.array([[prev_acc, rec_acc, attempts, latency, q_diff]], dtype=np.float64)

                prob = float(model.predict_proba(vec)[0])
                explanation = model.explain(vec[0])

                return MasteryResponse(
                    student_id=req.student_id,
                    topic_id=req.topic_id,
                    status=PredictionStatus.SUCCESS,
                    is_demo=False,
                    model_version=version,
                    mastery=MasteryScore(
                        score=round(prob, 4),
                        confidence=0.88,
                        algorithm_used=model.algorithm_name,
                        contributing_factors=explanation.get("top_contributing_features", {}),
                    ),
                )
            except Exception as e:
                logger.error(f"Inference error in predict_mastery: {e}")

        # Case B: Demo mode enabled
        if settings.demo_mode:
            return MasteryResponse(
                student_id=req.student_id,
                topic_id=req.topic_id,
                status=PredictionStatus.DEMO_DATA,
                is_demo=True,
                model_version=version,
                message="DEMO MODE: Synthetic deterministic score for UI integration testing only.",
                mastery=MasteryScore(
                    score=0.72,
                    confidence=0.90,
                    algorithm_used="mock_demo_generator",
                    contributing_factors={"recent_accuracy": 0.75, "attempts": 12},
                ),
            )

        # Case C: Baseline fallback if history is provided
        if force_baseline or (req.recent_interactions and len(req.recent_interactions) > 0) or req.historical_accuracy is not None:
            history = req.recent_interactions or []
            topic_interactions = [x for x in history if x.topic_id == req.topic_id]
            correct = sum(1 for x in topic_interactions if x.answer_correct)
            attempts = len(topic_interactions)

            recent_acc = req.recent_accuracy
            if recent_acc is None and topic_interactions:
                recent_acc = sum(1 for x in topic_interactions[-5:] if x.answer_correct) / len(topic_interactions[-5:])

            score = self.mastery_baseline.predict(correct, attempts, recent_acc)
            return MasteryResponse(
                student_id=req.student_id,
                topic_id=req.topic_id,
                status=PredictionStatus.FALLBACK_BASELINE,
                is_demo=False,
                model_version="baseline_v0.1.0",
                message="Estimated using Bayesian Laplace smoothed topic accuracy baseline.",
                mastery=MasteryScore(
                    score=score,
                    confidence=0.80,
                    algorithm_used="smoothed_historical_topic_accuracy",
                    contributing_factors={"total_attempts": attempts, "correct_count": correct},
                ),
            )

        # Case D: Placeholder Mode (Untrained, No Mocking Claimed)
        return MasteryResponse(
            student_id=req.student_id,
            topic_id=req.topic_id,
            status=PredictionStatus.MODEL_NOT_TRAINED,
            is_demo=False,
            model_version=version,
            message="No trained model artifact is currently available. Educational datasets will be integrated in the next phase.",
            mastery=None,
        )

    # =========================================================================
    # 2. QUESTION DIFFICULTY PREDICTION
    # =========================================================================
    def predict_difficulty(self, req: DifficultyRequest, force_baseline: bool = False) -> DifficultyResponse:
        version = settings.default_difficulty_model_version
        model: Optional[QuestionDifficultyPredictor] = self.loader.load_model("question_difficulty_predictor", version)

        if model and model.is_trained and settings.ml_mode == "active" and not force_baseline:
            try:
                q_diff = req.historical_question_accuracy if req.historical_question_accuracy is not None else 0.50
                prev_acc = req.student_mastery if req.student_mastery is not None else 0.50
                rec_acc = req.student_recent_accuracy if req.student_recent_accuracy is not None else prev_acc
                attempts = float((req.total_question_attempts or 0) + 1)
                latency = 25.0

                vec = np.array([[q_diff, prev_acc, rec_acc, attempts, latency]], dtype=np.float64)
                prob = float(model.predict_proba(vec)[0])
                diff_band = model.predict_difficulty_level(prob)
                explanation = model.explain(vec[0])

                return DifficultyResponse(
                    question_id=req.question_id,
                    status=PredictionStatus.SUCCESS,
                    is_demo=False,
                    model_version=version,
                    message=f"Calibrated probability P(correct) = {prob:.2%} via {model.algorithm_name}.",
                    prediction=DifficultyPrediction(
                        success_probability=round(prob, 4),
                        predicted_difficulty=diff_band,
                        is_student_specific=bool(req.student_id or req.student_mastery is not None),
                        confidence=0.88,
                        contributing_factors=explanation.get("feature_contributions", {}),
                    ),
                )
            except Exception as e:
                logger.error(f"Inference error in predict_difficulty: {e}")

        if settings.demo_mode:
            return DifficultyResponse(
                question_id=req.question_id,
                status=PredictionStatus.DEMO_DATA,
                is_demo=True,
                model_version=version,
                message="DEMO MODE: Synthetic question difficulty estimation for UI testing.",
                prediction=DifficultyPrediction(
                    success_probability=0.68,
                    predicted_difficulty=DifficultyLevel.MEDIUM,
                    is_student_specific=bool(req.student_id),
                    confidence=0.85,
                    contributing_factors={"baseline_rate": 0.65, "student_mastery_offset": 0.03},
                ),
            )

        # Baseline execution
        base_res = self.difficulty_baseline.predict(
            global_accuracy=req.historical_question_accuracy,
            student_mastery=req.student_mastery,
        )

        return DifficultyResponse(
            question_id=req.question_id,
            status=PredictionStatus.FALLBACK_BASELINE,
            is_demo=False,
            model_version="baseline_v0.1.0",
            message="Estimated using calibrated global item accuracy with student mastery offset.",
            prediction=DifficultyPrediction(
                success_probability=base_res["success_probability"],
                predicted_difficulty=base_res["predicted_difficulty"],
                is_student_specific=base_res["is_student_specific"],
                confidence=0.82,
                contributing_factors={"global_pass_rate": req.historical_question_accuracy or 0.65},
            ),
        )

    # =========================================================================
    # 3. WEAK TOPIC CLASSIFICATION
    # =========================================================================
    def classify_topics(self, req: TopicClassificationRequest, force_baseline: bool = False) -> TopicClassificationResponse:
        version = settings.default_topic_model_version
        model: Optional[WeakTopicClassifier] = self.loader.load_model("weak_topic_classifier", version)

        # Active ML inference
        if model and model.is_trained and settings.ml_mode == "active" and not force_baseline:
            try:
                results: List[TopicStatusResult] = []
                weak_list: List[str] = []

                topics_to_eval = []
                if req.topics:
                    for t in req.topics:
                        topics_to_eval.append({
                            "topic_id": t.topic_id,
                            "acc": t.topic_accuracy if t.topic_accuracy is not None else 0.50,
                            "rec_acc": t.recent_topic_accuracy if t.recent_topic_accuracy is not None else (t.topic_accuracy or 0.50),
                            "attempts": float(t.total_attempts or 0),
                            "consec_wrong": float(t.consecutive_wrong or 0),
                            "latency": float(t.average_time_seconds or 25.0),
                        })
                elif req.recent_interactions:
                    topics_map = {}
                    for x in req.recent_interactions:
                        topics_map.setdefault(x.topic_id, []).append(x)
                    for tid, items in topics_map.items():
                        answers = [1 if i.answer_correct else 0 for i in items]
                        acc = float(np.mean(answers))
                        rec_acc = float(np.mean(answers[-5:])) if len(answers) >= 5 else acc
                        consec = 0
                        for a in reversed(answers):
                            if a == 0:
                                consec += 1
                            else:
                                break
                        times = [i.time_taken_seconds for i in items if i.time_taken_seconds is not None]
                        lat = float(np.mean(times)) if times else 25.0
                        topics_to_eval.append({
                            "topic_id": tid,
                            "acc": acc,
                            "rec_acc": rec_acc,
                            "attempts": float(len(items)),
                            "consec_wrong": float(consec),
                            "latency": lat,
                        })

                if topics_to_eval:
                    for item in topics_to_eval:
                        vec = np.array([[item["acc"], item["rec_acc"], item["attempts"], item["consec_wrong"], item["latency"]]], dtype=np.float64)
                        class_idx = int(model.predict(vec)[0])
                        probs = model.predict_proba(vec)[0]
                        status_enum = WeakTopicClassifier.CLASS_LABELS[class_idx]
                        conf = float(probs[class_idx])

                        reasons = [f"Classified as {status_enum.value} with confidence {conf:.1%} by {model.algorithm_name}"]
                        if item["consec_wrong"] >= 3:
                            reasons.append(f"Student has {int(item['consec_wrong'])} consecutive wrong answers")
                        if item["acc"] < 0.50:
                            reasons.append(f"Topic accuracy ({item['acc']:.1%}) is below passing threshold")

                        res = TopicStatusResult(
                            topic_id=item["topic_id"],
                            status=status_enum,
                            confidence=round(conf, 4),
                            topic_accuracy=round(item["acc"], 4),
                            attempts_count=int(item["attempts"]),
                            intervention_recommended=(status_enum == TopicStatus.WEAK),
                            reasons=reasons,
                        )
                        results.append(res)
                        if status_enum == TopicStatus.WEAK:
                            weak_list.append(item["topic_id"])

                    return TopicClassificationResponse(
                        student_id=req.student_id,
                        status=PredictionStatus.SUCCESS,
                        is_demo=False,
                        model_version=version,
                        topics=results,
                        weak_topics=weak_list,
                        message=f"Classified {len(results)} topics using active {model.algorithm_name} model.",
                    )
            except Exception as e:
                logger.error(f"Inference error in classify_topics: {e}")

        if settings.demo_mode:
            demo_results = [
                TopicStatusResult(
                    topic_id="arrays",
                    status=TopicStatus.STRONG,
                    confidence=0.92,
                    topic_accuracy=0.85,
                    attempts_count=18,
                    intervention_recommended=False,
                    reasons=["Demo: Consistent strong accuracy above threshold"],
                ),
                TopicStatusResult(
                    topic_id="binary-trees",
                    status=TopicStatus.WEAK,
                    confidence=0.89,
                    topic_accuracy=0.42,
                    attempts_count=10,
                    intervention_recommended=True,
                    reasons=["Demo: Sub-50% accuracy requires targeted revision"],
                ),
            ]
            return TopicClassificationResponse(
                student_id=req.student_id,
                status=PredictionStatus.DEMO_DATA,
                is_demo=True,
                model_version=version,
                topics=demo_results,
                weak_topics=["binary-trees"],
                message="DEMO MODE: Synthetic topic classifications for frontend UI testing.",
            )

        # Use baseline heuristics
        results: List[TopicStatusResult] = []
        weak_list: List[str] = []

        if req.topics:
            for t in req.topics:
                pred = self.topic_baseline.predict(
                    topic_accuracy=t.topic_accuracy or 0.50,
                    recent_topic_accuracy=t.recent_topic_accuracy,
                    total_attempts=t.total_attempts or 0,
                    consecutive_wrong=t.consecutive_wrong or 0,
                )
                res = TopicStatusResult(
                    topic_id=t.topic_id,
                    status=pred["status"],
                    confidence=pred["confidence"],
                    topic_accuracy=t.topic_accuracy,
                    attempts_count=t.total_attempts,
                    intervention_recommended=pred["intervention_recommended"],
                    reasons=pred["reasons"],
                )
                results.append(res)
                if pred["status"] == TopicStatus.WEAK:
                    weak_list.append(t.topic_id)

        elif req.recent_interactions:
            # Group interactions by topic
            topics_map = {}
            for x in req.recent_interactions:
                topics_map.setdefault(x.topic_id, []).append(x)

            for tid, items in topics_map.items():
                acc = sum(1 for i in items if i.answer_correct) / len(items)
                pred = self.topic_baseline.predict(
                    topic_accuracy=acc,
                    total_attempts=len(items)
                )
                res = TopicStatusResult(
                    topic_id=tid,
                    status=pred["status"],
                    confidence=pred["confidence"],
                    topic_accuracy=round(acc, 4),
                    attempts_count=len(items),
                    intervention_recommended=pred["intervention_recommended"],
                    reasons=pred["reasons"],
                )
                results.append(res)
                if pred["status"] == TopicStatus.WEAK:
                    weak_list.append(tid)

        return TopicClassificationResponse(
            student_id=req.student_id,
            status=PredictionStatus.FALLBACK_BASELINE,
            is_demo=False,
            model_version="baseline_v0.1.0",
            topics=results,
            weak_topics=weak_list,
            message="Classified via pedagogical accuracy thresholds and error streak tracking.",
        )

    # =========================================================================
    # 4. QUESTION RECOMMENDATION
    # =========================================================================
    def recommend_questions(self, req: RecommendationRequest) -> RecommendationResponse:
        version = settings.default_recommender_version
        loaded_recommender = self.loader.load_model("question_recommender", version)
        engine = loaded_recommender if loaded_recommender else self.recommender_engine

        ranked = engine.rank_candidates(
            candidates=req.candidate_questions,
            student_mastery=req.student_mastery,
            weak_topics=req.weak_topics,
            target_difficulty=req.target_difficulty,
            exclude_question_ids=req.exclude_question_ids,
            top_k=req.top_k,
        )

        top_id = ranked[0].question_id if ranked else None
        algo = getattr(engine, "algorithm_name", "zpd_flow_scoring")

        return RecommendationResponse(
            student_id=req.student_id,
            status=PredictionStatus.SUCCESS if ranked else PredictionStatus.INSUFFICIENT_DATA,
            is_demo=settings.demo_mode,
            model_version=version,
            ranked_questions=ranked,
            top_question_id=top_id,
            message=f"Ranked using {algo} with weak topic boost and anti-repetition.",
        )
