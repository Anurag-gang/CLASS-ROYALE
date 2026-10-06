# Class Royale — Machine Learning Service Documentation

> **Supervised Student Modeling, Adaptive Curriculum Engine, and Recommendation Microservice**  
> Built with **Python 3.13**, **FastAPI**, **Scikit-Learn**, **Joblib**, **NumPy**, and **Pandas**.

---

## 1. Overview & Vision

The Class Royale Machine Learning Service (`ml-service/`) is an isolated Python microservice that powers intelligent, adaptive curriculum navigation. While conversational large language models handle natural language explanations, the ML Service provides the rigorous statistical backbone that:
- Models real-time **student topic mastery** ($0.0 \to 1.0$).
- Predicts **question difficulty** and personalized probability of success.
- Pinpoints **weak topics and knowledge decay** (`STRONG`, `NORMAL`, `WEAK`).
- Recommends candidate questions that keep students in the **Zone of Proximal Development (ZPD / Flow State)**.
- Emits deterministic **adaptive pedagogical actions** (`LOWER_DIFFICULTY`, `INCREASE_DIFFICULTY`, `REVISE_TOPIC`, `ANSWER_NEXT_QUESTION`, `TAKE_BREAK`).

---

## 2. Architecture: Separation of AI & Predictive ML

```
                               CLASS ROYALE
                                    │
                      ┌─────────────┴─────────────┐
                      ▼                           ▼
                 CR TUTOR                    ML SERVICE
            (Conversational AI)         (Supervised Learning)
                      │                           │
          Natural Language Reasoning         Structured Telemetry
          - Socratic Dialogue                - Mastery Score (0.0 - 1.0)
          - Code Debugging                   - Success Probability P(correct)
          - Loop Invariant Proofs            - Difficulty Calibration
                      │                      - Knowledge Decay Diagnosis
                      │                           │
                      └─────────────┬─────────────┘
                                    ▼
                         ADAPTIVE LEARNING ENGINE
                      (Deterministic Pedagogical Tree)
                                    │
                                    ▼
                         Directive & Telemetry:
                  { action: "LOWER_DIFFICULTY", mastery: 48% }
```

Supervised statistical ML does not replace conversational pedagogy, and conversational agents are not burdened with statistical telemetry clustering.

---

## 3. The 4 Supervised Learning Objectives

### 3.1. Student Mastery Predictor
- **Target:** Continuous mastery probability $\in [0.0, 1.0]$.
- **Models:** Logistic Regression, Random Forest Regressor, Gradient Boosting.
- **Baseline:** Bayesian Laplace-smoothed Historical Topic Accuracy:
  $$\text{Mastery} = \frac{\text{Correct} + 2}{\text{Attempts} + 4} \quad (\text{with 70/30 recency bias})$$

### 3.2. Question Difficulty Predictor
- **Target:** Probability that the student answers correctly:
  $$P(\text{correct} \mid \text{student, question})$$
- **Models:** Calibrated Logistic Regression, HistGradientBoostingClassifier.
- **Baseline:** Global Item Difficulty Offset:
  $$P(\text{correct}) = \text{clip}\left(P_{\text{global}} + 0.4 \times (\text{Mastery} - 0.5),\, 0.05,\, 0.95\right)$$

### 3.3. Weak Topic Classifier
- **Target:** 3-class knowledge status: `STRONG`, `NORMAL`, or `WEAK`.
- **Models:** Multi-Class Random Forest, Gradient Boosting.
- **Baseline:** Error Streak & Accuracy Threshold ($< 50\%$ accuracy or $\ge 3$ consecutive errors $\to$ `WEAK`).

### 3.4. Question Recommender
- **Target:** Ranking candidate questions to sustain the Flow State ($P \approx 0.65 - 0.75$).
- **Scoring Function:**
  $$\text{Score} = \left(0.50 \times \text{FlowScore} + \text{TopicBoost} + \text{DiffBoost}\right) \times \frac{1}{1 + 0.5 \times \text{TimesSeen}}$$

---

## 4. The Adaptive Learning Engine

Located at `app/adaptive/learning_engine.py`, the engine translates ML inferences into actionable educational decisions:

| Condition | Prescribed Action | Pedagogical Rationale |
| :--- | :--- | :--- |
| $\ge 3$ consecutive errors on topic | `LOWER_DIFFICULTY` | Temporarily lower question difficulty to rebuild foundational intuition. |
| Mastery $< 45\%$ or classified `WEAK` | `REVISE_TOPIC` | Trigger targeted active-recall revision before advancing. |
| $\ge 4$ consecutive correct & Mastery $\ge 80\%$ | `INCREASE_DIFFICULTY` | Advance student to challenge tier (edge cases, traps, proofs). |
| Session duration $> 45\text{ min}$ or latency spike | `TAKE_BREAK` | Cognitive fatigue detected; suggest a short rest to prevent burnout. |
| Balanced performance | `ANSWER_NEXT_QUESTION` | Student is stable within the flow state zone. |

---

## 5. Canonical Data Contract (`StudentInteraction`)

All student telemetry is ingested through a normalized, dataset-agnostic schema:

| Field | Type | Description |
| :--- | :--- | :--- |
| `student_id` | `str` | Anonymized unique student ID |
| `course_id` | `Optional[str]` | Course code (e.g. `CS-201`) |
| `topic_id` | `str` | Syllabus concept ID (e.g. `quicksort`, `dijkstra`, `avl-trees`) |
| `question_id` | `str` | Unique item identifier |
| `attempt_number` | `int` | Attempt index ($\ge 1$) |
| `previous_accuracy`| `Optional[float]` | Historical pass rate before this attempt |
| `recent_accuracy`  | `Optional[float]` | Rolling 5-attempt accuracy before this attempt |
| `time_taken_seconds`| `Optional[float]` | Response latency in seconds |
| `hints_used`       | `Optional[int]`   | Hint requests during attempt |
| `answer_correct`   | `bool`            | Target outcome label |

---

## 6. Feature Pipeline & Target Leakage Prevention

The feature extractor (`app/preprocessing/feature_pipeline.py`) derives **20 leak-free features** across 4 families:
1. **Student Features:** `student_total_attempts`, `student_overall_accuracy`, `student_recent_accuracy`, `student_rolling_accuracy_5`, `student_average_time`, `student_consecutive_correct`, `student_consecutive_wrong`.
2. **Topic Features:** `topic_attempts`, `topic_accuracy`, `recent_topic_accuracy`, `topic_attempt_streak`.
3. **Question Features:** `question_difficulty`, `question_attempt_number`.
4. **Temporal Features:** `time_since_last_attempt_seconds`, `session_attempt_number`.

### Strict Leakage Guardrail:
When constructing features at interaction timestamp $t$, the extractor enforces strict historical slicing: the target outcome `answer_correct` and future events $t' \ge t$ are completely excluded. The pipeline includes an automated `assert_no_leakage()` validation suite.

### Group-Aware Data Splitting:
To prevent interactions from the same student bleeding across partitions, training uses **`GroupShuffleSplit` on `student_id`**, ensuring models generalize to unseen students.

---

## 7. REST API Endpoints (Port 8000)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service liveness probe, version, and active status. |
| `GET` | `/models` | Catalog of loaded `.joblib` model artifacts. |
| `POST` | `/predict/mastery` | Predicts student topic mastery score ($0.0 \to 1.0$). |
| `POST` | `/predict/difficulty` | Estimates $P(\text{correct})$ and question difficulty. |
| `POST` | `/predict/topic` | Classifies topics into `STRONG`, `NORMAL`, `WEAK`. |
| `POST` | `/recommend/questions`| Ranks candidate question IDs for the student. |
| `POST` | `/adaptive/next-action`| Primary endpoint: returns decision directive, mastery %, and feature weights. |
| `POST` | `/predict/student-profile`| Generates full syllabus mastery profile across all subjects. |

Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.

---

## 8. Setup, Testing, and Execution

### Prerequisites
- Python `3.11+` or `3.13+`
- Virtual environment tool (`venv` or `uv`)

### Installation
```bash
# Navigate to microservice directory
cd ml-service

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Running the Pytest Test Suite
```bash
python -m pytest tests -v
```
All **51 test suites** pass in ~10 seconds with zero external dependencies.

### Running the Service
From the repository root:
```bash
npm run ml:start
```
Or directly via Uvicorn:
```bash
cd ml-service
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
