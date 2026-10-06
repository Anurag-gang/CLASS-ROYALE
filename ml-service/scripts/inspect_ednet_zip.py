"""
Streaming inspection of EdNet-KT1 zip archive without extracting 784,000 files to disk.
"""

import zipfile
import io
import pandas as pd
from pathlib import Path
from datetime import datetime

def inspect_ednet_zip():
    print("=" * 60)
    print("EDNET-KT1 ZIP STREAMING INSPECTION")
    print("=" * 60)
    zip_path = Path("datasets/raw/ednet/kt1/EdNet-KT1.zip")
    if not zip_path.exists():
        print(f"Error: {zip_path} not found.")
        return

    print(f"Archive file: {zip_path}")
    print(f"Archive size: {zip_path.stat().st_size:,} bytes ({zip_path.stat().st_size / (1024*1024):.2f} MB)")

    with zipfile.ZipFile(zip_path, 'r') as zf:
        infolist = zf.infolist()
        total_files = len(infolist)
        print(f"Total entries in archive: {total_files:,}")

        # Separate directory entries from csv files
        csv_files = [m for m in infolist if m.filename.endswith('.csv') and not m.filename.startswith('__MACOSX')]
        print(f"Total Student CSV files: {len(csv_files):,}")

        # Inspect the first 5 student files
        sample_entries = csv_files[:5]
        print(f"\n--- Sample Student Files ---")
        for m in sample_entries:
            print(f"File: {m.filename} | Compressed size: {m.compress_size:,} bytes | Uncompressed: {m.file_size:,} bytes")

        # Read the first student file
        first_member = sample_entries[0]
        with zf.open(first_member) as f:
            df_first = pd.read_csv(f)
            print(f"\nFirst student ({first_member.filename}) DataFrame shape: {df_first.shape}")
            print("Columns:", list(df_first.columns))
            print("Data types:\n", df_first.dtypes)
            print("First 3 rows:\n", df_first.head(3).to_dict(orient="records"))

        # Inspect aggregate statistics across a 1,000-student cohort
        sample_cohort_size = min(1000, len(csv_files))
        print(f"\n--- Streaming Aggregate Inspection across {sample_cohort_size:,} students ---")
        
        total_interactions = 0
        all_questions = set()
        elapsed_times = []
        user_answers = {}
        min_ts = float('inf')
        max_ts = float('-inf')

        for i, member in enumerate(csv_files[:sample_cohort_size]):
            with zf.open(member) as f:
                try:
                    df_u = pd.read_csv(f)
                    total_interactions += len(df_u)
                    if 'question_id' in df_u.columns:
                        all_questions.update(df_u['question_id'].dropna().unique())
                    if 'elapsed_time' in df_u.columns:
                        valid_elapsed = df_u['elapsed_time'].dropna()
                        if not valid_elapsed.empty:
                            elapsed_times.extend(valid_elapsed.iloc[::max(1, len(valid_elapsed)//10)].tolist())
                    if 'user_answer' in df_u.columns:
                        for ans, cnt in df_u['user_answer'].value_counts().items():
                            user_answers[ans] = user_answers.get(ans, 0) + cnt
                    if 'timestamp' in df_u.columns and not df_u['timestamp'].empty:
                        min_ts = min(min_ts, df_u['timestamp'].min())
                        max_ts = max(max_ts, df_u['timestamp'].max())
                except Exception as e:
                    print(f"Error reading {member.filename}: {e}")

        print(f"Sample cohort total interactions: {total_interactions:,}")
        print(f"Average interactions per student in sample: {total_interactions / sample_cohort_size:.1f}")
        print(f"Distinct questions encountered in sample: {len(all_questions):,}")
        print(f"User answer distribution in sample: {user_answers}")
        if elapsed_times:
            s_el = pd.Series(elapsed_times)
            print(f"Elapsed time summary (ms): mean={s_el.mean():.1f}, median={s_el.median():.1f}, min={s_el.min()}, max={s_el.max()}")
        if min_ts != float('inf'):
            print(f"Timestamp range in sample: {min_ts} to {max_ts} (relative ms elapsed since registration/epoch)")

if __name__ == "__main__":
    inspect_ednet_zip()
