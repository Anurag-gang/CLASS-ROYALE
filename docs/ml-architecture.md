# Class Royale Machine Learning Engine — Architecture Specification

```
                         CLASS ROYALE
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
          ▼                                       ▼
     CR TUTOR                                ML SERVICE
   Conversational                         Supervised ML
   Educational AI                        Student Modeling
  (OpenRouter LLM)                      (FastAPI / Scikit)
          │                                       │
          │                         ┌─────────────┼─────────────┐
          │                         ▼             ▼             ▼
          │                    Data Contract Preprocessing Features
          │                         │             │             │
          │                         └─────────────┼─────────────┘
          │                                       ▼
          │                            ┌─────────────────────┐
          │                            │     MODEL LAYER     │
          │                            ├─────────────────────┤
          │                            │ Mastery Predictor   │
          │                            │ Difficulty Model    │
          │                            │ Topic Classifier    │
          │                            │ Recommender Engine  │
          │                            └─────────────────────┘
          │                                       │
          └───────────────────┬───────────────────┘
                              ▼
                   ADAPTIVE LEARNING ENGINE
                 (Deterministic Decision Tree)
                              │
                              ▼
                   Adaptive Recommendation
                    (Next Action / Quizzes)
                              │
                              ▼
                           STUDENT
```

---

## 1. Architectural Principles

1. **Isolation of Responsibilities:**  
   The ML Service is solely responsible for statistical student modeling and curriculum recommendations. It does NOT own UI state, authentication, XP accounting, or course enrollment permissions.
2. **Dataset-Agnostic Design:**  
   All external datasets (EdNet, ASSISTments, OULAD) map into the canonical `StudentInteraction` schema. The model layer never couples to proprietary raw schemas.
3. **Strict Target Leakage Safeguards:**  
   Target labels (`answer_correct`, `mastery_score`) are excluded from feature vectors. Features at timestamp $t$ strictly observe past telemetry.
4. **Student-Level Group Splitting:**  
   Cross-validation partitions students into disjoint groups (`GroupShuffleSplit` on `student_id`) to prevent identical student history from bleeding between train and test sets.
5. **No Fake Performance Claims:**  
   Untrained models operate in safe `placeholder` mode. No metrics (ROC-AUC, Accuracy, F1) are claimed or reported before training on real datasets.

---

## 2. End-to-End Interaction Flow

```
[1] Student submits answer in Next.js Quiz Interface
     │
     ▼
[2] Next.js Route (`/api/quizzes/submit`) records answer outcome in Database
     │
     ▼
[3] Next.js Backend calls ML Service: `POST /adaptive/next-action`
     │
     ├── Body contains: `student_id`, `topic_id`, `current_question_id`, `last_answer_correct`
     │
     ▼
[4] ML Service Feature Pipeline extracts 20 leak-free Student/Topic/Temporal features
     │
     ▼
[5] Model Layer executes predictions:
     ├── Mastery Predictor: Estimates topic competency score (0.0 to 1.0)
     ├── Weak Topic Classifier: Evaluates if topic is STRONG, NORMAL, or WEAK
     ├── Difficulty Predictor: Calculates P(correct | student, question)
     └── Recommender Engine: Ranks available questions for Zone of Proximal Development
     │
     ▼
[6] Adaptive Learning Engine synthesizes signals into deterministic decision:
     ├── `LOWER_DIFFICULTY` if consecutive errors >= 3
     ├── `REVISE_TOPIC` if topic mastery < 0.45 (WEAK)
     ├── `INCREASE_DIFFICULTY` if consecutive correct >= 4
     └── `ANSWER_NEXT_QUESTION` if in flow state
     │
     ▼
[7] Next.js Quiz Interface renders the prescribed pedagogical action & next question
```

---

## 3. Database Integration Contract (Future PostgreSQL / Supabase Tables)

To prepare for seamless production integration without breaking the existing SQLite development database, the following SQL schema definitions are established:

```sql
-- 1. Student Interaction Telemetry Log
CREATE TABLE IF NOT EXISTS student_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(64) NOT NULL,
    course_id VARCHAR(64),
    module_id VARCHAR(64),
    topic_id VARCHAR(64) NOT NULL,
    question_id VARCHAR(64) NOT NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    time_taken_seconds NUMERIC(8, 2),
    hints_used INT NOT NULL DEFAULT 0,
    answer_correct BOOLEAN NOT NULL,
    question_difficulty NUMERIC(4, 3),
    mastery_score NUMERIC(4, 3),
    session_id VARCHAR(64),
    source_type VARCHAR(16) NOT NULL DEFAULT 'REAL', -- 'REAL' or 'SYNTHETIC'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_topic_time 
ON student_interactions (student_id, topic_id, created_at);

-- 2. Materialized Student Topic Mastery
CREATE TABLE IF NOT EXISTS student_topic_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(64) NOT NULL,
    topic_id VARCHAR(64) NOT NULL,
    mastery_score NUMERIC(4, 3) NOT NULL,
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 0.85,
    status VARCHAR(16) NOT NULL DEFAULT 'NORMAL', -- 'STRONG', 'NORMAL', 'WEAK'
    total_attempts INT NOT NULL DEFAULT 0,
    consecutive_correct INT NOT NULL DEFAULT 0,
    consecutive_wrong INT NOT NULL DEFAULT 0,
    last_model_version VARCHAR(32) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, topic_id)
);

-- 3. Calibrated Question Statistics
CREATE TABLE IF NOT EXISTS question_statistics (
    question_id VARCHAR(64) PRIMARY KEY,
    topic_id VARCHAR(64) NOT NULL,
    calibrated_difficulty NUMERIC(4, 3) NOT NULL DEFAULT 0.500,
    difficulty_level VARCHAR(16) NOT NULL DEFAULT 'MEDIUM', -- 'EASY', 'MEDIUM', 'HARD'
    total_attempts INT NOT NULL DEFAULT 0,
    total_correct INT NOT NULL DEFAULT 0,
    average_latency_seconds NUMERIC(8, 2) DEFAULT 45.0,
    last_calibrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ML Prediction Audit Log
CREATE TABLE IF NOT EXISTS ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(32) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    prediction_type VARCHAR(32) NOT NULL, -- 'mastery', 'difficulty', 'topic', 'recommendation', 'adaptive'
    model_version VARCHAR(32) NOT NULL,
    inputs_json JSONB NOT NULL,
    outputs_json JSONB NOT NULL,
    inference_duration_ms NUMERIC(8, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Registered Model Lineage
CREATE TABLE IF NOT EXISTS model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(64) NOT NULL,
    model_version VARCHAR(32) NOT NULL,
    algorithm VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    training_dataset VARCHAR(128) NOT NULL,
    validation_metrics_json JSONB,
    test_metrics_json JSONB,
    hyperparameters_json JSONB,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (model_name, model_version)
);
```

---

## 4. Security & Model Persistence Protections

`app/registry/store.py` defines the `ModelArtifactStore` abstraction.

### Deserialization Safety Rules:
1. **Confined Directory Bounds:** Model file paths must reside strictly within `settings.model_registry_path`. Directory traversal attempts are rejected.
2. **Integrity Validation:** Every model folder stores an immutable companion `metadata.json` documenting the training dataset, algorithm, and training timestamp.
3. **No Dynamic Remote Pickle Loads:** Serialized artifacts are never downloaded or evaluated dynamically from untrusted remote URLs at runtime.
