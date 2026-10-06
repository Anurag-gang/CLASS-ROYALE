"""
Integration Tests for FastAPI REST Endpoints
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.config.settings import settings


@pytest.fixture
def client():
    # Force placeholder mode for test safety
    settings.ml_mode = "placeholder"
    settings.demo_mode = False
    return TestClient(app)


def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "class-royale-ml-service"


def test_models_catalog_endpoint(client):
    res = client.get("/models")
    assert res.status_code == 200
    data = res.json()
    assert "total_models" in data
    assert data["total_models"] >= 4
    model_names = [m["model_name"] for m in data["models"]]
    assert "mastery_predictor" in model_names
    assert "question_difficulty_predictor" in model_names


def test_predict_mastery_placeholder(client):
    payload = {
        "student_id": "student_test_01",
        "topic_id": "binary-search-trees",
    }
    res = client.post("/predict/mastery", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "MODEL_NOT_TRAINED"
    assert data["is_demo"] is False
    assert data["mastery"] is None


def test_predict_mastery_demo_mode(client):
    settings.demo_mode = True
    payload = {
        "student_id": "student_test_demo",
        "topic_id": "binary-search-trees",
    }
    res = client.post("/predict/mastery", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "DEMO_DATA"
    assert data["is_demo"] is True
    assert data["mastery"]["score"] > 0.0
    settings.demo_mode = False


def test_predict_difficulty_endpoint(client):
    payload = {
        "question_id": "q_math_01",
        "historical_question_accuracy": 0.70,
        "student_mastery": 0.80,
    }
    res = client.post("/predict/difficulty", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["prediction"]["success_probability"] > 0.0
    assert data["prediction"]["predicted_difficulty"] in ("EASY", "MEDIUM", "HARD")


def test_predict_topic_endpoint(client):
    payload = {
        "student_id": "s1",
        "topics": [
            {"topic_id": "arrays", "topic_accuracy": 0.85, "total_attempts": 10},
            {"topic_id": "trees", "topic_accuracy": 0.35, "total_attempts": 8},
        ],
    }
    res = client.post("/predict/topic", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["topics"]) == 2
    assert "trees" in data["weak_topics"]


def test_recommend_questions_endpoint(client):
    payload = {
        "student_id": "s1",
        "topic_id": "graphs",
        "candidate_questions": [
            {"question_id": "q1", "topic_id": "graphs", "difficulty": 0.5, "times_seen_by_student": 0},
            {"question_id": "q2", "topic_id": "graphs", "difficulty": 0.8, "times_seen_by_student": 2},
        ],
        "top_k": 2,
    }
    res = client.post("/recommend/questions", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["ranked_questions"]) == 2
    assert data["top_question_id"] == "q1"


def test_adaptive_next_action_endpoint(client):
    payload = {
        "student_id": "s1",
        "topic_id": "dsa-sorting",
        "last_answer_correct": False,
        "consecutive_wrong": 3,
    }
    res = client.post("/adaptive/next-action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["action"] == "LOWER_DIFFICULTY"
    assert "consecutive errors" in data["action_rationale"].lower()


def test_validation_error_on_bad_payload(client):
    # Missing required field 'student_id'
    res = client.post("/predict/mastery", json={"topic_id": "trees"})
    assert res.status_code == 422


def test_openapi_docs(client):
    res = client.get("/openapi.json")
    assert res.status_code == 200
    schema = res.json()
    assert "paths" in schema
    assert "/predict/mastery" in schema["paths"]
    assert "/adaptive/next-action" in schema["paths"]
