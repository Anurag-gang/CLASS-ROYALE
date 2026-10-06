# Dataset Compatibility Matrix — Class Royale Adaptive Learning Engine

## Task Definitions
1. **Mastery Prediction**: Predicting student knowledge state in a target pedagogical topic over sequential attempts.
2. **Weak Topic Classification**: Diagnosing lagging syllabus topics requiring scaffolded remediation.
3. **Question Difficulty Calibration**: Estimating item pass rate $P(\text{correct})$ and categorical challenge band.
4. **Next Question Recommendation**: Ranking candidate questions to keep students in their Zone of Proximal Development (ZPD flow state).
5. **Session Performance / Dropout**: Predicting study session duration, completion velocity, or learning fatigue.

---

## Compatibility Matrix

| Dataset | Acquisition Status | Mastery | Weak Topic | Difficulty | Recommendation | Session Performance |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **EdNet-KT1** | **DOWNLOADED & NORMALIZED** | **HIGH** | **MEDIUM** | **HIGH** | **HIGH** | **HIGH** |
| **MathE** | **DOWNLOADED & NORMALIZED** | **HIGH** | **HIGH** | **HIGH** | **MEDIUM** | **LOW** |
| **ASSISTments** | *REQUIRES MANUAL ACTION* | HIGH* | HIGH* | MEDIUM* | HIGH* | MEDIUM* |
| **OULAD** | *REQUIRES MANUAL ACTION* | LOW* | LOW* | LOW* | LOW* | HIGH* |

*\*Ratings for ASSISTments and OULAD represent literature-based projections pending manual researcher acquisition.*

---

## Evidence & Rationale

### 1. EdNet-KT1
- **Mastery (HIGH)**: Rich, multi-attempt sequential logs (average 153.8 attempts per student in sample cohort) allow high-fidelity knowledge tracing over time.
- **Weak Topic (MEDIUM)**: Categorized across 7 broad TOEIC parts and 1,792 skill tag combinations. Fine-grained diagnostic classification is possible, but skill tags are occasionally multi-label.
- **Difficulty (HIGH)**: 13,169 distinct items with extensive repeated attempts (cohort accuracy = 69.87%) enable robust item response theory (IRT) calibration.
- **Recommendation (HIGH)**: Enormous question candidate pool (13,169 items) with known tags and pass rates allows testing of flow-state distance metrics, anti-repetition decay, and diversity ranking.
- **Session Performance (HIGH)**: Millisecond-level latency telemetry (`time_taken_seconds`, mean = 24.31s) enables modeling of solving speed and engagement degradation.

### 2. MathE
- **Mastery (HIGH)**: Focuses directly on university undergraduate engineering mathematics (Linear Algebra, Calculus, Differential Equations). Closely mirrors Class Royale's core syllabus.
- **Weak Topic (HIGH)**: Clean 14-topic by 24-subtopic taxonomy with zero missing entries. Enables precise diagnosis of prerequisite failure (e.g. failing Vector Spaces within Linear Algebra).
- **Difficulty (HIGH)**: Explicit expert-assigned difficulty bands (`Basic` = 82.2%, `Advanced` = 17.8%) paired with empirical student pass rates (53.2% vs 46.8%).
- **Recommendation (MEDIUM)**: Modest catalog size (833 items) provides adequate candidate pools for targeted concept practice, though smaller than EdNet.
- **Session Performance (LOW)**: No timestamps or response latencies recorded in raw data; unsuited for real-time velocity modeling.

### 3. ASSISTments (Secondary)
- Longitudinal K-12 mathematics assessment data with scaffolding hint requests. High suitability for mastery and recommendation if acquired.

### 4. OULAD (Secondary)
- Modular virtual learning environment (VLE) interaction data covering whole course registrations and dropouts. Low suitability for granular item recommendation, but high suitability for institutional retention prediction.
