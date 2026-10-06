"""
Deep inspection of raw MathE and EdNet Contents datasets.
Calculates rows, columns, data types, missing values, duplicates, unique values, class balances.
"""

import pandas as pd
import numpy as np
from pathlib import Path

def inspect_mathe():
    print("=" * 60)
    print("MATHE DATASET DEEP INSPECTION")
    print("=" * 60)
    mathe_csv = Path("datasets/raw/mathe/MathE dataset (4).csv")
    if not mathe_csv.exists():
        print(f"Error: {mathe_csv} not found")
        return
    
    # Try different separators and encodings
    for enc in ["latin1", "cp1252", "utf-8", "iso-8859-1"]:
        try:
            for sep in [";", ",", "\t"]:
                df = pd.read_csv(mathe_csv, sep=sep, encoding=enc)
                if len(df.columns) > 1:
                    print(f"Detected encoding: '{enc}', separator: '{sep}' with {len(df.columns)} columns")
                    break
            else:
                continue
            break
        except Exception:
            continue

    print(f"Shape: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"File size: {mathe_csv.stat().st_size:,} bytes")
    print("\nColumns and Data Types:")
    for col, dtype in df.dtypes.items():
        print(f"  - {col}: {dtype}")

    print("\nMissing Values Count & Pct:")
    for col in df.columns:
        null_count = df[col].isnull().sum()
        pct = (null_count / len(df)) * 100.0
        print(f"  - {col}: {null_count} missing ({pct:.2f}%)")

    print("\nDuplicate Rows (full row):", df.duplicated().sum())

    # Check Student ID and Question ID duplicates
    if "Student ID" in df.columns and "Question ID" in df.columns:
        student_col = "Student ID"
        question_col = "Question ID"
    else:
        # Search by substring
        student_col = [c for c in df.columns if "student" in c.lower()][0]
        question_col = [c for c in df.columns if "question" in c.lower() and "id" in c.lower()][0]
    
    dup_interactions = df.duplicated(subset=[student_col, question_col]).sum()
    print(f"Duplicate (Student, Question) interactions: {dup_interactions}")

    print(f"Unique Students: {df[student_col].nunique()}")
    print(f"Unique Questions: {df[question_col].nunique()}")

    topic_cols = [c for c in df.columns if "topic" in c.lower()]
    for tc in topic_cols:
        print(f"Unique {tc}: {df[tc].nunique()}")
        print(f"  Top values:\n{df[tc].value_counts().head(5)}")

    ans_cols = [c for c in df.columns if "answer" in c.lower()]
    for ac in ans_cols:
        print(f"\nDistribution of {ac}:")
        print(df[ac].value_counts(dropna=False))
        print(f"Percentages:\n{df[ac].value_counts(normalize=True, dropna=False) * 100}")

    level_cols = [c for c in df.columns if "level" in c.lower() or "difficulty" in c.lower()]
    for lc in level_cols:
        print(f"\nDistribution of {lc}:")
        print(df[lc].value_counts(dropna=False))

    print("\nFirst 3 rows:")
    print(df.head(3).to_dict(orient="records"))

def inspect_ednet_contents():
    print("\n" + "=" * 60)
    print("EDNET CONTENTS METADATA DEEP INSPECTION")
    print("=" * 60)
    q_csv = Path("datasets/raw/ednet/contents/contents/questions.csv")
    if not q_csv.exists():
        print(f"Error: {q_csv} not found")
        return

    df_q = pd.read_csv(q_csv)
    print(f"Questions metadata shape: {df_q.shape[0]} rows, {df_q.shape[1]} columns")
    print("Columns & dtypes:")
    for col, dtype in df_q.dtypes.items():
        print(f"  - {col}: {dtype}")
    print("\nMissing values:")
    for col in df_q.columns:
        print(f"  - {col}: {df_q[col].isnull().sum()} missing")
    print(f"Unique question_ids: {df_q['question_id'].nunique()}")
    if "correct_answer" in df_q.columns:
        print("Correct answer distribution:")
        print(df_q["correct_answer"].value_counts(normalize=True))
    if "part" in df_q.columns:
        print("TOEIC Part distribution:")
        print(df_q["part"].value_counts())
    if "tags" in df_q.columns:
        print(f"Unique tag combinations: {df_q['tags'].nunique()}")

    print("\nFirst 3 rows of questions.csv:")
    print(df_q.head(3).to_dict(orient="records"))

    l_csv = Path("datasets/raw/ednet/contents/contents/lectures.csv")
    if l_csv.exists():
        df_l = pd.read_csv(l_csv)
        print(f"\nLectures metadata shape: {df_l.shape[0]} rows, {df_l.shape[1]} columns")
        print("First 2 rows of lectures.csv:")
        print(df_l.head(2).to_dict(orient="records"))

if __name__ == "__main__":
    inspect_mathe()
    inspect_ednet_contents()
