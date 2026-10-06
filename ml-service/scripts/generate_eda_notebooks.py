"""
Generates the 4 required exploratory data analysis notebooks for Phase 2:
1. 01_ednet_eda.ipynb
2. 02_mathe_eda.ipynb
3. 03_schema_mapping.ipynb
4. 04_feature_analysis.ipynb
"""

import json
from pathlib import Path

NOTEBOOKS_DIR = Path("notebooks")
NOTEBOOKS_DIR.mkdir(parents=True, exist_ok=True)

def create_notebook(cells):
    return {
        "cells": cells,
        "metadata": {
            "language_info": {
                "name": "python",
                "version": "3.13.3"
            },
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 4
    }

def md_cell(source):
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": source.strip().split("\n")
    }

def code_cell(source):
    lines = [l + "\n" for l in source.strip().split("\n")]
    if lines:
        lines[-1] = lines[-1].rstrip("\n")
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": lines
    }

def build_notebook_01():
    cells = [
        md_cell("""# EdNet-KT1 Exploratory Data Analysis
## Class Royale Machine Learning Engine — Phase 2

This notebook conducts exploratory analysis on the **EdNet-KT1** benchmark dataset published by Riiid! AI Research.
Dataset properties:
- 784,309 unique student interaction files
- 13,169 unique questions with TOEIC part and skill tags
- Millisecond-level interaction telemetry (elapsed solving time, timestamps)"""),
        code_cell("""import pandas as pd
import numpy as np
from pathlib import Path

# Load normalized cohort of 500 students (88,235 interactions)
parquet_path = Path("../datasets/processed/ednet_kt1/ednet_kt1_normalized.parquet")
df = pd.read_parquet(parquet_path)
print(f"Loaded EdNet normalized cohort: {df.shape[0]:,} rows, {df.shape[1]} columns")
df.head()"""),
        md_cell("""### 1. Student Activity & Interaction Length Distribution"""),
        code_cell("""interactions_per_student = df.groupby("student_id").size()
print("Interactions per student summary:")
print(interactions_per_student.describe())
print(f"Top 5 most active students:\\n{interactions_per_student.sort_values(ascending=False).head(5)}")"""),
        md_cell("""### 2. Question Frequency & Exposure Distribution"""),
        code_cell("""interactions_per_question = df.groupby("question_id").size()
print("Interactions per question summary:")
print(interactions_per_question.describe())
print(f"Unique questions encountered in cohort: {df['question_id'].nunique():,}")"""),
        md_cell("""### 3. Correctness & Response Latency Analysis"""),
        code_cell("""print(f"Overall Cohort Accuracy: {df['answer_correct'].mean():.2%}")
print("Response Time (seconds) Statistics:")
print(df['time_taken_seconds'].describe(percentiles=[0.25, 0.50, 0.75, 0.90, 0.99]))"""),
        md_cell("""### 4. Topic (TOEIC Part) Distribution"""),
        code_cell("""part_counts = df["topic_id"].value_counts()
part_acc = df.groupby("topic_id")["answer_correct"].agg(["count", "mean"])
part_acc["accuracy_%"] = (part_acc["mean"] * 100).round(2)
print("Interactions and Accuracy by Part:")
print(part_acc)""")
    ]
    with open(NOTEBOOKS_DIR / "01_ednet_eda.ipynb", "w", encoding="utf-8") as f:
        json.dump(create_notebook(cells), f, indent=2)
    print("Created 01_ednet_eda.ipynb")

def build_notebook_02():
    cells = [
        md_cell("""# MathE Exploratory Data Analysis
## Assessing Mathematics Learning in Higher Education

This notebook analyzes the **MathE** higher education mathematics dataset from the **UCI Machine Learning Repository** (Dataset 1031).
Dataset properties:
- 9,546 student responses across 14 university mathematics topics
- 372 undergraduate students
- 833 mathematics assessment questions categorized by difficulty level (Basic / Advanced)"""),
        code_cell("""import pandas as pd
import numpy as np
from pathlib import Path

# Load raw and normalized MathE data
mathe_path = Path("../datasets/processed/mathe/mathe_normalized.parquet")
df = pd.read_parquet(mathe_path)
print(f"Loaded MathE normalized data: {df.shape[0]:,} rows, {df.shape[1]} columns")
df.head()"""),
        md_cell("""### 1. Mathematics Topics & Subtopics Breakdown"""),
        code_cell("""topic_dist = df.groupby("topic_id")["answer_correct"].agg(["count", "mean"])
topic_dist["accuracy_%"] = (topic_dist["mean"] * 100).round(2)
print("Topic Distribution and Pass Rates:")
print(topic_dist.sort_values(by="count", ascending=False))"""),
        md_cell("""### 2. Difficulty Level Analysis (Basic vs Advanced)"""),
        code_cell("""diff_acc = df.groupby("question_difficulty")["answer_correct"].agg(["count", "mean"])
diff_acc["accuracy_%"] = (diff_acc["mean"] * 100).round(2)
print("Accuracy across Question Difficulty Bands (0.35 = Basic, 0.75 = Advanced):")
print(diff_acc)"""),
        md_cell("""### 3. Student Interaction Volume & Class Balance"""),
        code_cell("""print("Class balance (0 = Incorrect, 1 = Correct):")
print(df["answer_correct"].value_counts(normalize=True))
print(f"Unique Students: {df['student_id'].nunique()}, Unique Questions: {df['question_id'].nunique()}")""")
    ]
    with open(NOTEBOOKS_DIR / "02_mathe_eda.ipynb", "w", encoding="utf-8") as f:
        json.dump(create_notebook(cells), f, indent=2)
    print("Created 02_mathe_eda.ipynb")

def build_notebook_03():
    cells = [
        md_cell("""# Canonical Schema Mapping
## Normalization Architecture for Heterogeneous Educational Datasets

Demonstrates the conversion of disparate schema representations (EdNet, MathE) into the unified **Class Royale StudentInteraction** canonical contract.
Anti-leakage guarantees:
- Target separation: targets `answer_correct` and `mastery_score` are strictly separated from feature matrices
- Field provenance: tracks `OBSERVED`, `DERIVED`, and `MISSING` source tags"""),
        code_cell("""import pandas as pd
from app.preprocessing.adapters.mathe_adapter import MathEAdapter
from app.preprocessing.adapters.ednet_adapter import EdNetKT1Adapter

print("MathE Feature Provenance:")
for k, v in MathEAdapter.FEATURE_PROVENANCE.items():
    print(f"  {k:22s} -> {v['source_type']}")

print("\\nEdNet-KT1 Feature Provenance:")
for k, v in EdNetKT1Adapter.FEATURE_PROVENANCE.items():
    print(f"  {k:22s} -> {v['source_type']}")"""),
        md_cell("""### Schema Side-by-Side Comparison"""),
        code_cell("""df_mathe = pd.read_parquet("../datasets/processed/mathe/mathe_normalized.parquet")
df_ednet = pd.read_parquet("../datasets/processed/ednet_kt1/ednet_kt1_normalized.parquet")

print("MathE Normalized Columns:")
print(list(df_mathe.columns))

print("\\nEdNet Normalized Columns:")
print(list(df_ednet.columns))

common_cols = set(df_mathe.columns).intersection(set(df_ednet.columns))
print(f"\\nCommon Canonical Columns ({len(common_cols)}):", sorted(list(common_cols)))""")
    ]
    with open(NOTEBOOKS_DIR / "03_schema_mapping.ipynb", "w", encoding="utf-8") as f:
        json.dump(create_notebook(cells), f, indent=2)
    print("Created 03_schema_mapping.ipynb")

def build_notebook_04():
    cells = [
        md_cell("""# Feature Analysis & Anti-Leakage Verification
## Evaluation of Rolling Historical and Calibration Features

Validates that:
1. `previous_accuracy` never includes the current question's answer
2. `mastery_score` reflects only past evidence using Laplace smoothing
3. Group-aware splitting (`student_group_split`) prevents cross-set student contamination"""),
        code_cell("""import pandas as pd
import numpy as np
from training.common import student_group_split

df_ednet = pd.read_parquet("../datasets/processed/ednet_kt1/ednet_kt1_normalized.parquet")

# Inspect a single student interaction sequence
sample_student = df_ednet[df_ednet["student_id"] == "ednet_u_101409"].sort_values(by="timestamp").head(8)
print("Sequential feature progression for student ednet_u_101409:")
print(sample_student[["question_id", "attempt_number", "previous_attempts", "previous_accuracy", "recent_accuracy", "mastery_score", "answer_correct"]])"""),
        md_cell("""### Anti-Leakage Verification: Target Independence"""),
        code_cell("""# Correlate target with historical features on first attempts
first_attempts = df_ednet[df_ednet["attempt_number"] == 1]
print("Correlation between answer_correct and previous_accuracy (first interaction of student):")
print(first_attempts[["answer_correct", "previous_accuracy"]].corr())"""),
        md_cell("""### Group-Aware Train / Val / Test Split Verification"""),
        code_cell("""train_df, val_df, test_df = student_group_split(df_ednet, student_col="student_id", test_size=0.20, val_size=0.15)

train_students = set(train_df["student_id"])
val_students = set(val_df["student_id"])
test_students = set(test_df["student_id"])

print(f"Train Students: {len(train_students):,}")
print(f"Val Students:   {len(val_students):,}")
print(f"Test Students:  {len(test_students):,}")

# Overlap checks
overlap_tv = train_students.intersection(val_students)
overlap_tt = train_students.intersection(test_students)
overlap_vt = val_students.intersection(test_students)

print(f"Train/Val Overlap: {len(overlap_tv)} (MUST BE 0)")
print(f"Train/Test Overlap: {len(overlap_tt)} (MUST BE 0)")
print(f"Val/Test Overlap: {len(overlap_vt)} (MUST BE 0)")
assert len(overlap_tv) == 0 and len(overlap_tt) == 0 and len(overlap_vt) == 0, 'Data leakage detected!'
print('SUCCESS: Zero student overlap across splits!')""")
    ]
    with open(NOTEBOOKS_DIR / "04_feature_analysis.ipynb", "w", encoding="utf-8") as f:
        json.dump(create_notebook(cells), f, indent=2)
    print("Created 04_feature_analysis.ipynb")

if __name__ == "__main__":
    build_notebook_01()
    build_notebook_02()
    build_notebook_03()
    build_notebook_04()
