import json
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("================ ML ENGINE ENDPOINT VERIFICATION ================")
    
    # 1. Health check
    res = client.get("/health")
    print(f"\n[1] GET /health -> Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    assert res.status_code == 200

    # 2. Model catalog
    res = client.get("/models")
    print(f"\n[2] GET /models -> Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    assert res.status_code == 200

    # 3. Predict Mastery
    res = client.post("/predict/mastery", json={
        "student_id": "student_001",
        "topic_id": "dsa_trees",
        "historical_accuracy": 0.75,
        "recent_accuracy": 0.80,
        "total_attempts": 20,
        "consecutive_correct": 3,
        "average_time_seconds": 25.5
    })
    print(f"\n[3] POST /predict/mastery -> Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    assert res.status_code == 200

    # 4. Predict Difficulty
    res = client.post("/predict/difficulty", json={
        "question_id": "q_dsa_trees_01",
        "topic_id": "dsa_trees",
        "student_id": "student_001",
        "student_mastery": 0.65,
        "historical_question_accuracy": 0.55,
        "total_question_attempts": 120
    })
    print(f"\n[4] POST /predict/difficulty -> Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    assert res.status_code == 200

    # 5. Predict Weak Topic
    res = client.post("/predict/topic", json={
        "student_id": "student_001",
        "topics": [
            {
                "topic_id": "dsa_trees",
                "topic_accuracy": 0.35,
                "recent_topic_accuracy": 0.20,
                "total_attempts": 10,
                "consecutive_wrong": 3,
                "average_time_seconds": 45.0
            },
            {
                "topic_id": "dsa_arrays",
                "topic_accuracy": 0.85,
                "recent_topic_accuracy": 0.90,
                "total_attempts": 15,
                "consecutive_wrong": 0,
                "average_time_seconds": 20.0
            }
        ]
    })
    print(f"\n[5] POST /predict/topic -> Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    assert res.status_code == 200

    # 6. Recommend Questions
    res = client.post("/recommend/questions", json={
        "student_id": "student_001",
        "topic_id": "dsa_trees",
        "student_mastery": 0.60,
        "candidate_questions": [
            {
                "question_id": "q_dsa_trees_01",
                "topic_id": "dsa_trees",
                "difficulty": 0.6,
                "times_seen_by_student": 0
            },
            {
                "question_id": "q_dsa_trees_02",
                "topic_id": "dsa_trees",
                "difficulty": 0.75,
                "times_seen_by_student": 1
            }
        ],
        "top_k": 2
    })
    print(f"\n[6] POST /recommend/questions -> Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    assert res.status_code == 200

    # 7. Adaptive Next Action
    res = client.post("/adaptive/next-action", json={
        "student_id": "student_001",
        "topic_id": "dsa_trees",
        "current_question_id": "q_dsa_trees_01",
        "last_answer_correct": False,
        "consecutive_wrong": 3,
        "consecutive_correct": 0,
        "time_taken_seconds": 55.0
    })
    print(f"\n[7] POST /adaptive/next-action -> Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    assert res.status_code == 200

    # 8. Student Profile Batch Analysis
    now_iso = datetime.now(timezone.utc).isoformat()
    res = client.post("/predict/student-profile", json={
        "student_id": "student_001",
        "interactions": [
            {
                "student_id": "student_001",
                "question_id": "q_01",
                "topic_id": "dsa_trees",
                "answer_correct": True,
                "time_taken_seconds": 25.0,
                "timestamp": now_iso
            },
            {
                "student_id": "student_001",
                "question_id": "q_02",
                "topic_id": "dsa_graphs",
                "answer_correct": False,
                "time_taken_seconds": 65.0,
                "timestamp": now_iso
            }
        ]
    })
    print(f"\n[8] POST /predict/student-profile -> Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    assert res.status_code == 200

    # 9. OpenAPI JSON schema verification
    res = client.get("/openapi.json")
    print(f"\n[9] GET /openapi.json -> Status: {res.status_code}")
    openapi = res.json()
    print(f"OpenAPI Title: {openapi.get('info', {}).get('title')} v{openapi.get('info', {}).get('version')}")
    print(f"Total Routes Documented: {len(openapi.get('paths', {}))}")
    assert res.status_code == 200
    
    print("\n================ ALL 9 ENDPOINT CHECKS PASSED PERFECTLY! ================\n")

if __name__ == "__main__":
    test_endpoints()
