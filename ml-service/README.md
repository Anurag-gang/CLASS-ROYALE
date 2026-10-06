# Class Royale — Adaptive Learning Machine Learning Service

> **Foundation Release (v0.1.0) — Supervised ML Architecture**  
> **Status:** Dataset-Agnostic Engine Ready for Real Educational Dataset Integration.  
> **Compliance Notice:** No external datasets have been downloaded, and no model performance metrics (ROC-AUC, F1, Accuracy) are fabricated. Models run in safe `placeholder` mode until Phase 2 dataset integration.

---

## 1. Purpose & Scope

The Class Royale Machine Learning Service is an isolated Python microservice providing supervised learning predictions to drive dynamic curriculum adaptation across university computer science and engineering subjects.

The engine models:
- **Student Mastery:** Estimating topic-specific competency ($0.0 \to 1.0$).
- **Question Difficulty:** Predicting personalized success probability $P(\text{correct} \mid \text{student, question})$.
- **Weak Topic Classification:** Pinpointing knowledge decay and diagnosing concepts requiring revision (`STRONG`, `NORMAL`, `WEAK`).
- **Next Question Recommendation:** Ranking candidate questions to keep students in the Zone of Proximal Development ($P \approx 0.65 - 0.75$) while preventing repetitive exposure.
- **Adaptive Pedagogical Decisions:** Orchestrating ML signals into actionable educational directives (`ANSWER_NEXT_QUESTION`, `REVISE_TOPIC`, `LOWER_DIFFICULTY`, `INCREASE_DIFFICULTY`, `PRACTICE_WEAK_TOPIC`, `REVIEW_CONCEPT`, `TAKE_BREAK`).

The ML Service is strictly isolated from frontend rendering, XP math, auth, and game mechanics.

---

## 2. Architecture Overview

```
                      CLASS ROYALE
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
        CR TUTOR                     ML SERVICE
    (Conversational LLM           (Supervised ML
     Pedagogical Agent)         Student Modeling)
             │                           │
             │           ┌───────────────┼───────────────┐
             │           ▼               ▼               ▼
             │      Data Contract  Preprocessing   Feature Eng
             │           │               │               │
             │           └───────────────┼───────────────┘
             │                           ▼
             │                  ┌─────────────────┐
             │                  │   MODEL LAYER   │
             │                  ├─────────────────┤
             │                  │ Mastery (LR/GB) │
             │                  │ Difficulty      │
             │                  │ Weak Topics     │
             │                  │ Recommender     │
             │                  └─────────────────┘
             │                           │
             └─────────────┬─────────────┘
                           ▼
                ADAPTIVE LEARNING ENGINE
            (Deterministic Decision Tree)
                           │
                           ▼
                 Pedagogical Decision
             (Next Action / Question IDs)
```

---

## 3. Separation of Conversational AI & Predictive ML

Class Royale clearly distinguishes two complementary AI systems:
1. **CR Tutor / Conversational AI (`src/lib/cr/`):** Generative LLM via OpenRouter for natural language dialogues, step-by-step problem breakdown, code debugging, and Socratic questioning.
2. **Class Royale ML Service (`ml-service/`):** Classical supervised ML models trained on structured telemetry to predict numeric mastery, calibrate difficulty, and recommend curriculum paths.

Supervised statistical ML does not replace conversational intelligence, and generative LLMs are not burdened with statistical telemetry clustering.

---

## 4. Dataset-Agnostic Canonical Data Contract

To prevent vendor lock-in to specific educational datasets (EdNet, ASSISTments, OULAD, etc.), the engine ingests all telemetry through a canonical interaction schema:

### `StudentInteraction` Contract:
| Field | Type | Role | Description |
| :--- | :--- | :--- | :--- |
| `student_id` | `str` | `RAW` | Anonymized unique student ID |
| `course_id` | `Optional[str]` | `OPTIONAL` | Course code (e.g. CS-201) |
| `module_id` | `Optional[str]` | `OPTIONAL` | Syllabus module code |
| `topic_id` | `str` | `RAW` | Syllabus concept ID |
| `question_id` | `str` | `RAW` | Unique item identifier |
| `attempt_number` | `int` | `RAW` | Attempt index ($\ge 1$) |
| `previous_attempts` | `Optional[int]` | `DERIVED` | Prior attempts count |
| `previous_accuracy` | `Optional[float]` | `DERIVED` | Prior historical pass rate |
| `recent_accuracy` | `Optional[float]` | `DERIVED` | Rolling 5-attempt accuracy |
| `time_taken_seconds` | `Optional[float]` | `OPTIONAL` | Response latency (bounded) |
| `hints_used` | `Optional[int]` | `OPTIONAL` | Hint request count |
| `answer_correct` | `bool` | `TARGET` | Attempt outcome label |
| `mastery_score` | `Optional[float]` | `TARGET` | Ground-truth mastery label |
| `source_type` | `str` | `RAW` | Lineage marker: `REAL` or `SYNTHETIC` |

---

## 5. Feature Engineering & Target Leakage Prevention

The feature extractor (`app/preprocessing/feature_pipeline.py`) derives 20 leak-free features across 4 families:

1. **Student Features:** `student_total_attempts`, `student_overall_accuracy`, `student_recent_accuracy`, `student_rolling_accuracy_5`, `student_average_time`, `student_median_time`, `student_consecutive_correct`, `student_consecutive_wrong`, `student_hint_usage_rate`, `student_retry_rate`.
2. **Topic Features:** `topic_attempts`, `topic_accuracy`, `recent_topic_accuracy`, `topic_time_average`, `topic_attempt_streak`.
3. **Question Features:** `question_difficulty`, `question_attempt_number`.
4. **Temporal Features:** `time_since_last_attempt_seconds`, `session_attempt_number`, `day_of_week`.

### Leakage Guardrail:
When constructing features at interaction timestamp $t$, the extractor enforces strict historical slicing: the target outcome `answer_correct` and future events $t' \ge t$ are excluded. The pipeline provides `assert_no_leakage()` verification.

---

## 6. Supervised Models & Classical Baselines

Each modeling objective provides both pluggable candidate ML algorithms and classical pedagogical baselines:

### Model 1: Student Mastery Predictor
- **ML Candidates:** Logistic Regression, Random Forest, Gradient Boosting, HistGradientBoosting.
- **Baseline:** Bayesian Laplace-smoothed Historical Topic Accuracy:
  $$\text{Mastery} = \frac{\text{Correct} + 2}{\text{Attempts} + 4}$$
  with a $70/30$ recency bias weighting when recent trials are available.

### Model 2: Question Difficulty Predictor
- **ML Candidates:** Logistic Regression, Random Forest, Gradient Boosting.
- **Baseline:** Global Calibrated Question Accuracy with Student Offset:
  $$P(\text{correct}) = \text{clip}(P_{\text{global}} + 0.4 \times (\text{Mastery} - 0.5), 0.05, 0.95)$$

### Model 3: Weak Topic Classifier
- **ML Candidates:** 3-Class Random Forest, Gradient Boosting.
- **Baseline:** Threshold & Error Streak Heuristic ($< 50\%$ accuracy or $\ge 3$ consecutive errors $\to$ `WEAK`).

### Model 4: Question Recommender
- **Architecture:** Flow-State Optimization Score ($P \approx 0.70$) combined with Weak Topic Reinforcement ($+0.35$), Difficulty Target Alignment ($+0.25$), and Novelty Decay:
  $$\text{Score} = (0.50 \times \text{FlowScore} + \text{TopicBoost} + \text{DiffBoost}) \times \frac{1}{1 + 0.5 \times \text{TimesSeen}}$$
- **Baseline:** Boolean heuristic match (Target Weak Topic + Target Difficulty + Unseen).

---

## 7. Group-Aware Data Splitting

To prevent severe target leakage, `training/common.py` implements **Student-Level Group Splitting** (`GroupShuffleSplit` on `student_id`).

Random row-level splitting in educational interaction streams causes interactions from the same student to bleed into both train and test partitions, resulting in artificially inflated test scores. Student-level splitting forces models to generalize to completely unseen students.

---

## 8. Evaluation Framework

`evaluation/metrics.py` implements standardized metrics ready to consume test predictions once real datasets are trained:
- **Classification:** Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, Log Loss, Confusion Matrix.
- **Regression:** MAE, RMSE, $R^2$.
- **Probability Calibration:** Brier Score Loss, Log Loss.
- **Ranking:** Precision@K, Recall@K, Mean Reciprocal Rank (MRR), NDCG@K.

---

## 9. Operating Modes

The service supports two operating modes configured via `.env`:
1. `ML_MODE=placeholder` (Default):
   Returns structured `status: "MODEL_NOT_TRAINED"` responses when an artifact is not fitted. Never fabricates predictions.
2. `DEMO_MODE=true` (Optional):
   Returns deterministic sample responses explicitly flagged with `is_demo: true` for frontend UI integration testing.

---

## 10. REST API Reference

Exposed on port `8000`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service liveness probe and environment status |
| `GET` | `/models` | Catalog of registered models and training status |
| `POST` | `/predict/mastery` | Estimates student topic mastery score ($0.0 \to 1.0$) |
| `POST` | `/predict/difficulty` | Estimates $P(\text{correct})$ and difficulty level |
| `POST` | `/predict/topic` | Classifies topics into STRONG, NORMAL, WEAK |
| `POST` | `/recommend/questions` | Ranks candidate questions |
| `POST` | `/adaptive/next-action` | Emits pedagogical next-action decision |
| `POST` | `/predict/student-profile` | Generates full syllabus mastery profile |

Interactive documentation is available at `/docs` (Swagger UI) and `/redoc`.

---

## 11. Privacy & PII Handling

The ML Service requires zero personally identifiable information (PII). All models operate strictly on opaque `student_id` UUIDs/hashes, topic codes, question keys, and numerical timestamps. Names, email addresses, institutional identifiers, IP addresses, and credentials never cross the ML boundary.

---

## 12. Local Development & Testing

### Running Tests:
```bash
python -m pytest tests -v
```
All 38 test suites run in under 12 seconds with zero external network or database requirements.

### Running the API Server:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Docker Deployment:
```bash
docker compose -f docker-compose.ml.yml up --build
```

---

## 13. Next Phase: Real Dataset Integration Roadmap

Phase 2 will execute the empirical pipeline:
1. Download external datasets (EdNet, ASSISTments 2009/2015, OULAD).
2. Implement specific `DatasetAdapter` subclasses (`EdNetAdapter`, `ASSISTmentsAdapter`).
3. Normalize raw data into canonical `StudentInteraction` parquet tables.
4. Execute student-level train/validation/test splits.
5. Train and compare candidate algorithms against baselines.
6. Register the winning models into `artifacts/models/`.
7. Switch `ML_MODE=active` for live inference.
