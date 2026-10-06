# Data Quality Report — Class Royale Educational Dataset Normalization

## Quality Assurance Policy
In accordance with Class Royale research principles:
- Raw datasets are **preserved untouched**.
- No suspicious records are silently deleted.
- Irregularities, extremes, and potential data-hygiene anomalies are explicitly flagged, documented, and handled via defensive clipping or categorization.

---

## 1. MathE Dataset Data Quality Audit

| Inspection Check | Metric / Finding | Quality Assessment | Handling Policy |
| :--- | :--- | :--- | :--- |
| **Missing Values** | 0 missing across all 9,546 rows | **PASS** (100% complete) | No imputation required |
| **Malformed IDs** | All `Student ID` and `Question ID` parse to non-negative integers | **PASS** | Formatted as `mathe_s_{id}` and `mathe_q_{id}` |
| **Invalid Categories** | `Question Level` has exactly two distinct values: `Basic` (7,844), `Advanced` (1,702) | **PASS** | Mapped to difficulty scores $0.35$ and $0.75$ |
| **Binary Target Range** | `Type of Answer` contains strictly values in $\{0, 1\}$ | **PASS** | Used directly as ground-truth `answer_correct` |
| **Full Row Duplicates** | 2,083 identical rows out of 9,546 ($21.8\%$) | **FLAGGED** | Preserved; reflects multiple identical student submissions or repeated quiz sessions |
| **Repeated Items** | 2,764 duplicate `(Student, Question)` pairs ($28.9\%$) | **EXPECTED** | Used to calculate sequential `attempt_number` and `previous_attempts` |
| **Encoding Anomalies** | CP1252 / latin1 apostrophes (e.g. byte 0x92) | **RESOLVED** | Explicitly loaded using `latin1` encoding; no data corruption |

---

## 2. EdNet-KT1 Dataset Data Quality Audit

| Inspection Check | Metric / Finding | Quality Assessment | Handling Policy |
| :--- | :--- | :--- | :--- |
| **Missing Primary Keys** | 0 missing student IDs, 0 missing question IDs | **PASS** | Validated across all processed student files |
| **Malformed Question IDs** | All question IDs strictly match pattern `q[0-9]+` | **PASS** | Successfully joined with official `questions.csv` catalog |
| **Answer Correctness** | Ground-truth answers strictly in $\{a, b, c, d\}$ | **PASS** | Deterministic equality check (`user_answer == correct_answer`) |
| **Negative Elapsed Times** | $\min(\text{elapsed\_time}) = 0\text{ ms}$; negative times = 0 | **PASS** | No negative latency entries detected |
| **Extreme Latencies** | $\max(\text{elapsed\_time}) = 7,776,000\text{ ms}$ (~90 days, student left app open) | **FLAGGED** | Clipped to pedagogical ceiling of $3,600,000\text{ ms}$ (1 hour) |
| **Timestamp Continuity** | Millisecond values strictly monotonically non-decreasing per student | **PASS** | Chronological sequence strictly enforced |
| **Full Row Duplicates** | 0 full duplicate rows | **PASS** | Clean interaction logging |
| **Repeated Question Items** | 20,136 repeated `(student, question)` pairs in cohort ($22.8\%$) | **EXPECTED** | Used to model learning retention and decay |

---

## 3. Anti-Leakage Feature Quality Verification

| Derived Feature | Calculation Formula | Target Inversion Risk | Verification Check |
| :--- | :--- | :---: | :--- |
| `attempt_number` | `cumcount() + 1` | None | Strictly sequential |
| `previous_attempts` | `attempt_number - 1` | None | Strictly $\ge 0$; strictly prior to current event |
| `previous_accuracy` | `shift(1).cumsum() / shift(1).cumcount()` | High (if unshifted) | **VERIFIED**: First interaction yields uninformative prior ($0.50$); current answer excluded |
| `recent_accuracy` | `shift(1).rolling(5).mean()` | High (if unshifted) | **VERIFIED**: Strictly prior rolling window; current answer excluded |
| `mastery_score` | `(prior_topic_correct + 1) / (prior_topic_attempts + 2)` | Critical | **VERIFIED**: Laplace smoothing over strictly past topic attempts |

---

## 4. Student-Aware Splitting Integrity

When partitioning interaction rows for supervised model validation:
- **Blind Random Splitting**: REJECTED. (Causes severe target leakage by allowing a student's prior and future patterns into both training and test sets).
- **Enforced Strategy**: `GroupShuffleSplit` on `student_id`.
  - **Train / Validation Student Overlap**: **0 students**
  - **Train / Test Student Overlap**: **0 students**
  - **Validation / Test Student Overlap**: **0 students**
