# Dataset Report — Class Royale Educational Dataset Acquisition

## Executive Summary
This report documents the acquisition, schema inspection, licensing terms, and pedagogical compatibility of real educational benchmark datasets for the Class Royale Adaptive Learning Engine.

All statistics reported herein reflect **genuine measurements** computed directly on the downloaded official datasets without extrapolation or fabrication.

---

## 1. EdNet-KT1

- **Official Source**: [Riiid! AI Research GitHub Repository](https://github.com/riiid/ednet) (Official Google Drive Mirror)
- **Official License**: Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
- **Archive File Size**: 1,201,163,816 bytes (1,145.52 MB compressed ZIP)
- **Auxiliary Metadata Size**: 173,976 bytes (`EdNet-Contents.zip`)
- **SHA256 (KT1)**: `0d13933f90201c5101c7fe8659e44474fa049e3fb93181a8ba6fb3e63267b535`
- **SHA256 (Contents)**: `aa910a0436d9dbac0ba232f55e27b37ad8d39da285fcf15f1c1eb5d064be98e7`

### Structure
- Archive contains **784,309 individual student CSV files** formatted as `KT1/u{user_id}.csv`.
- Content metadata provides two auxiliary reference tables:
  1. `contents/questions.csv` (13,169 question rows)
  2. `contents/lectures.csv` (1,021 lecture rows)

### Columns
- **Student Interaction File (`KT1/u{id}.csv`)**:
  - `timestamp`: int64 (Relative millisecond elapsed time since user registration/epoch)
  - `solving_id`: int64 (Session attempt index)
  - `question_id`: str (Question ID matching `questions.csv`, e.g. `q8098`)
  - `user_answer`: str (Student's selected option: `a`, `b`, `c`, `d`)
  - `elapsed_time`: int64 (Latency in milliseconds spent on the question)
- **Questions Metadata (`questions.csv`)**:
  - `question_id`: str (Item key, e.g. `q1`)
  - `bundle_id`: str (Question bundle / passage grouping)
  - `explanation_id`: str (Associated explanation reference)
  - `correct_answer`: str (Ground truth answer key: `a`, `b`, `c`, `d`)
  - `part`: int64 (TOEIC Section Part 1 to 7)
  - `tags`: str (Semicolon-delimited knowledge component tags, e.g. `1;2;179;181`)
  - `deployed_at`: int64 (Deployment timestamp)

### Counts (Cohort Sample: 500 Students Processed)
- **Student count (Full Archive)**: 784,309 unique students
- **Cohort Students Processed**: 500 students
- **Interaction count (Cohort)**: 88,235 interactions
- **Question count (Cohort)**: 11,332 unique questions encountered (out of 13,169 total items in catalog)
- **Topics/Parts**: 7 TOEIC curriculum sections (Parts 1–7)
- **Knowledge Component Tags**: 1,792 unique tag combinations

### Missing Values
- `timestamp`: 0 missing
- `question_id`: 0 missing
- `user_answer`: 0 missing
- `elapsed_time`: 0 missing
- `correct_answer`: 0 missing
- `part`: 0 missing
- `tags`: 0 missing

### Duplicates
- **Full Row Duplicates**: 0
- **Duplicate (Student, Question) Interactions**: 20,136 interactions in the cohort represent repeat attempts on previously attempted questions, enabling genuine learning curve and retention modeling.

### Temporal Range
- Millisecond timestamps range from **2017-04-26T09:09:50Z** to **2019-12-02T09:43:47Z** (~2.5 years of longitudinal learning interaction).

### Relevant ML Targets
- `answer_correct` (Binary classification: whether `user_answer == correct_answer`, cohort baseline pass rate = 69.87%)
- `mastery_score` (Continuous topic knowledge state via Bayesian Laplace smoothing)
- `question_difficulty` (Item response calibration via empirical pass rate $1 - \bar{p}$)

### Available Features
- Chronological sequence index (`attempt_number`, `previous_attempts`)
- Pre-interaction historical student accuracy (`previous_accuracy`, shift 1)
- Rolling 5-attempt recent accuracy (`recent_accuracy`, shift 1)
- Response latency in seconds (`time_taken_seconds`, mean = 24.31s, median = 20.0s)
- Curriculum hierarchy (`topic_id` from TOEIC Part, `module_id` from primary tag)

### Missing Desired Features
- Hints used (Not tracked in KT1; KT3/KT4 tracks deeper interaction types)
- Course context (Single multi-subject certification domain)
- Explicit pedagogical difficulty rating (Derived empirically)

### Recommended Usage
- **Primary benchmark for sequential Knowledge Tracing (KT), next-question difficulty prediction, and learning velocity estimation.**

---

## 2. MathE — Assessing Mathematics Learning in Higher Education

- **Official Source**: [UCI Machine Learning Repository (Dataset 1031)](https://archive.ics.uci.edu/dataset/1031/assessing+mathematics+learning+in+higher+education)
- **Official License**: Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Archive Size**: 45,240 bytes (ZIP)
- **Uncompressed Size**: 1,057,461 bytes (`MathE dataset (4).csv`)
- **SHA256**: `403752d2bb708264ff6b62e5c281566ab196435a68d145de25c86432c1781e7a`

### Structure
- Single tabular CSV file encoded in `latin1` using semicolon (`;`) delimiters.

### Columns
- `Student ID`: int64 (Anonymized student identifier)
- `Student Country`: str (Student country of origin)
- `Question ID`: int64 (Mathematics question identifier)
- `Type of Answer`: int64 (0 = Incorrect, 1 = Correct)
- `Question Level`: str (`Basic`, `Advanced`)
- `Topic`: str (Higher education mathematics subject area)
- `Subtopic`: str (Specific modular mathematics skill)
- `Keywords`: str (Concept keywords associated with the question)

### Counts
- **Total Interaction Rows**: 9,546
- **Student count**: 372 undergraduate engineering students
- **Question count**: 833 assessment questions
- **Topic count**: 14 university mathematics topics
- **Subtopic count**: 24 subtopics

### Top Topics & Subtopics
1. **Linear Algebra**: 5,726 responses (Vector Spaces: 2,749, Linear Transformations: 2,127, Linear Systems: 420)
2. **Fundamental Mathematics**: 818 responses (Algebraic expressions, Equations, and Inequalities: 496)
3. **Complex Numbers**: 592 responses
4. **Differentiation**: 579 responses
5. **Analytic Geometry**: 358 responses
6. **Statistics**: 340 responses
7. **Numerical Methods**: 310 responses

### Class Balance & Question Level
- `Type of Answer`:
  - `0` (Incorrect): 5,076 (53.17%)
  - `1` (Correct): 4,470 (46.83%)
  - *Balanced ground truth target.*
- `Question Level`:
  - `Basic`: 7,844 (82.17%)
  - `Advanced`: 1,702 (17.83%)

### Missing Values
- **Zero missing values** across all 8 columns ($0.00\%$).

### Duplicates
- **Identical Full Rows**: 2,083
- **Duplicate (Student, Question) Interactions**: 2,764 (Students re-attempting identical questions across study sessions).

### Temporal Range
- Static interaction log; relative sequence preserved via row ordering.

### Relevant ML Targets
- `answer_correct` (Binary 0/1)
- `question_difficulty` (`Basic` vs `Advanced` classification)
- `topic_id` / `module_id` mastery modeling

### Available Features
- Topic hierarchy (`Topic`, `Subtopic`)
- Question difficulty category (`Basic` $\to 0.35$, `Advanced` $\to 0.75$)
- Rolling prior accuracy (`previous_accuracy`, strictly shifted by 1)
- Rolling recent accuracy (`recent_accuracy`, strictly shifted by 1)
- Prior Laplace topic mastery (`mastery_score`, strictly shifted by 1)
- Demographics (`Student Country`)

### Missing Desired Features
- Timestamps (Not recorded in MathE)
- Response latency (Not recorded)
- Hints used (Not recorded)

### Recommended Usage
- **Primary benchmark for university-level engineering mathematics topic mastery, prerequisite diagnostics, and basic-vs-advanced difficulty grading.**

---

## 3. ASSISTments (Secondary Dataset)

- **Source**: Worcester Polytechnic Institute (WPI)
- **Status**: `DOWNLOAD_REQUIRES_MANUAL_ACTION`
- **License**: Academic Research Use / Institutional Agreement
- **Access Protocol**: Direct automated access is blocked by the Google Sites authentication wall. Researchers must submit the institutional request form at `https://sites.google.com/site/assistmentsdata/home`.
- **Planned Target**: ASSISTments 2012–2013 or 2009–2010 skill builder data.

---

## 4. OULAD — Open University Learning Analytics Dataset (Secondary Dataset)

- **Source**: The Open University (UK) Knowledge Media Institute
- **Status**: `DOWNLOAD_REQUIRES_MANUAL_ACTION`
- **License**: CC BY 4.0 with Institutional Data Agreement
- **Access Protocol**: Direct headless downloading serves the terms agreement form at `https://analyse.kmi.open.ac.uk/open_dataset/download`. Requires academic project registration.
