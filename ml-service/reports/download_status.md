# Download Status Report — Class Royale Educational Dataset Acquisition

## Summary Overview
- **Primary Datasets Acquired**: 2 of 2 (EdNet-KT1, MathE) + Auxiliary Question Metadata
- **Secondary Datasets**: 2 flagged with `DOWNLOAD_REQUIRES_MANUAL_ACTION`
- **Total Raw Data Preserved**: ~1.20 GB compressed / ~5.6 GB uncompressed
- **Zero In-Place Raw Alterations**: All raw archives and extracted files preserved untouched in `ml-service/datasets/raw/`.

---

## Detailed Acquisition Status

| Dataset Key | Official Source | Status | File Size | SHA256 Verification | Normalized Output |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `mathe` | UCI Machine Learning Repository (ID 1031) | **VALIDATED_AND_NORMALIZED** | 45.2 KB (1.05 MB uncompressed) | **VALID** (`403752d2...`) | `datasets/processed/mathe/mathe_normalized.parquet` & `.csv` (9,546 rows) |
| `ednet_contents` | Riiid! AI Research GitHub / Google Drive | **VALIDATED** | 174 KB | **VALID** (`aa910a04...`) | `datasets/raw/ednet/contents/contents/questions.csv` (13,169 rows) |
| `ednet_kt1` | Riiid! AI Research GitHub / Google Drive | **VALIDATED_AND_NORMALIZED** | 1.15 GB (1,201,163,816 bytes) | **VALID** (`0d13933f...`) | `datasets/processed/ednet_kt1/ednet_kt1_normalized.parquet` (88,235 cohort rows across 2 partitions) |
| `assistments` | Worcester Polytechnic Institute (WPI) | **DOWNLOAD_REQUIRES_MANUAL_ACTION** | N/A | N/A | Manual academic researcher registration required |
| `oulad` | The Open University (UK) Knowledge Media Institute | **DOWNLOAD_REQUIRES_MANUAL_ACTION** | N/A | N/A | Institutional Data Transfer Agreement required |

---

## Protocols for Datasets Requiring Manual Action

### 1. ASSISTments
- **Access URL**: https://sites.google.com/site/assistmentsdata/home
- **Reason**: The official host has locked direct automated downloads behind dynamic Google Drive permission prompts and researcher agreements.
- **Action Required**:
  1. Access `https://sites.google.com/site/assistmentsdata/home/2012-13-school-data-with-affect`.
  2. Complete the institutional data access agreement.
  3. Place the downloaded CSV into `ml-service/datasets/raw/assistments/`.

### 2. OULAD (Open University Learning Analytics Dataset)
- **Access URL**: https://analyse.kmi.open.ac.uk/open_dataset/download
- **Reason**: The official download portal serves an interactive terms acceptance form rather than static HTTP file endpoints.
- **Action Required**:
  1. Navigate to `https://analyse.kmi.open.ac.uk/open_dataset/download`.
  2. Complete the data agreement form specifying project affiliation.
  3. Alternatively, download via Kaggle: `https://www.kaggle.com/datasets/anlgrbz/student-demographics-online-education-dataoulad`.
  4. Place extracted tables (`studentInfo.csv`, `studentVle.csv`) into `ml-service/datasets/raw/oulad/`.
