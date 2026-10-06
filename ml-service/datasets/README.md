# Class Royale Dataset Directory

## CRITICAL RESEARCH COMPLIANCE RULE:
- **`raw/synthetic_dev_data.csv` is strictly SYNTHETIC and for architecture verification/unit tests only.**
- **DO NOT** report any evaluation metrics, ROC-AUC, accuracy, or F1 scores based on synthetic development data.
- **DO NOT** claim synthetic models as validated research outputs.
- Real educational benchmarks (EdNet, ASSISTments, OULAD, etc.) will be downloaded, validated, and normalized in the subsequent dataset integration phase.

## Directory Structure:
- `raw/`: Unmodified external dataset downloads (when integrated in next phase).
- `interim/`: Intermediate transformed staging files produced by DatasetAdapters.
- `processed/`: Canonical normalized CSV/Parquet files ready for feature engineering and training.
