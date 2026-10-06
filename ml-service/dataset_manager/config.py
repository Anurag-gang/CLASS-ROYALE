"""
Dataset Manager Configuration & Registry
Paths, official URLs, licenses, and expected checksums for Phase 2 datasets.
"""

from pathlib import Path
from typing import Dict, Any

# Root paths relative to ml-service
BASE_DIR = Path(__file__).resolve().parent.parent
DATASETS_DIR = BASE_DIR / "datasets"
RAW_DIR = DATASETS_DIR / "raw"
INTERIM_DIR = DATASETS_DIR / "interim"
PROCESSED_DIR = DATASETS_DIR / "processed"
METADATA_DIR = DATASETS_DIR / "metadata"
REPORTS_DIR = BASE_DIR / "reports"

# Dataset Registry Specifications
DATASET_SPECS: Dict[str, Dict[str, Any]] = {
    "mathe": {
        "name": "MathE",
        "full_name": "Assessing Mathematics Learning in Higher Education",
        "category": "PRIMARY",
        "source": "UCI Machine Learning Repository",
        "official_url": "https://archive.ics.uci.edu/dataset/1031/assessing+mathematics+learning+in+higher+education",
        "download_url": "https://archive.ics.uci.edu/static/public/1031/dataset+for+assessing+mathematics+learning+in+higher+education.zip",
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "raw_dir": RAW_DIR / "mathe",
        "interim_dir": INTERIM_DIR / "mathe",
        "processed_dir": PROCESSED_DIR / "mathe",
        "expected_files": ["MathE dataset (4).csv"],
        "archive_name": "mathe_dataset.zip",
        "requires_auth": False,
        "is_automatic": True,
    },
    "ednet_contents": {
        "name": "EdNet-Contents",
        "full_name": "EdNet Question and Lecture Content Metadata",
        "category": "PRIMARY_AUXILIARY",
        "source": "Riiid AI Research (Official Google Drive Mirror from GitHub repo)",
        "official_url": "https://github.com/riiid/ednet",
        "download_url": "https://drive.usercontent.google.com/download?id=117aYJAWG3GU48suS66NPaB82HwFj6xWS&export=download&confirm=t",
        "license": "CC BY-NC 4.0",
        "license_url": "https://creativecommons.org/licenses/by-nc/4.0/",
        "raw_dir": RAW_DIR / "ednet" / "contents",
        "interim_dir": INTERIM_DIR / "ednet_contents",
        "processed_dir": PROCESSED_DIR / "ednet_contents",
        "expected_files": ["contents/questions.csv", "contents/lectures.csv"],
        "archive_name": "EdNet-Contents.zip",
        "requires_auth": False,
        "is_automatic": True,
    },
    "ednet_kt1": {
        "name": "EdNet-KT1",
        "full_name": "EdNet Knowledge Tracing Level 1 Student Interactions",
        "category": "PRIMARY",
        "source": "Riiid AI Research (Official Google Drive Mirror from GitHub repo)",
        "official_url": "https://github.com/riiid/ednet",
        "download_url": "https://drive.usercontent.google.com/download?id=1AmGcOs5U31wIIqvthn9ARqJMrMTFTcaw&export=download&confirm=t",
        "license": "CC BY-NC 4.0",
        "license_url": "https://creativecommons.org/licenses/by-nc/4.0/",
        "raw_dir": RAW_DIR / "ednet" / "kt1",
        "interim_dir": INTERIM_DIR / "ednet_kt1",
        "processed_dir": PROCESSED_DIR / "ednet_kt1",
        "archive_name": "EdNet-KT1.zip",
        "requires_auth": False,
        "is_automatic": True,
    },
    "assistments": {
        "name": "ASSISTments",
        "full_name": "ASSISTments Longitudinal Student Response Dataset",
        "category": "SECONDARY",
        "source": "Worcester Polytechnic Institute (WPI)",
        "official_url": "https://sites.google.com/site/assistmentsdata/home",
        "download_url": None,
        "license": "Academic Research Use / Institutional Agreement",
        "license_url": "https://sites.google.com/site/assistmentsdata/home",
        "raw_dir": RAW_DIR / "assistments",
        "requires_auth": True,
        "is_automatic": False,
        "status": "DOWNLOAD_REQUIRES_MANUAL_ACTION",
        "instructions": (
            "1. Visit https://sites.google.com/site/assistmentsdata/home\n"
            "2. Submit academic researcher data access agreement.\n"
            "3. Once approved, place downloaded CSV into ml-service/datasets/raw/assistments/."
        )
    },
    "oulad": {
        "name": "OULAD",
        "full_name": "Open University Learning Analytics Dataset",
        "category": "SECONDARY",
        "source": "The Open University (UK)",
        "official_url": "https://analyse.kmi.open.ac.uk/open_dataset",
        "download_url": "https://analyse.kmi.open.ac.uk/open_dataset/download",
        "license": "CC BY 4.0 with Terms Agreement",
        "license_url": "https://analyse.kmi.open.ac.uk/open_dataset/terms",
        "raw_dir": RAW_DIR / "oulad",
        "requires_auth": True,
        "is_automatic": False,
        "status": "DOWNLOAD_REQUIRES_MANUAL_ACTION",
        "instructions": (
            "1. Visit https://analyse.kmi.open.ac.uk/open_dataset/download\n"
            "2. Complete the data transfer agreement form with your academic institution.\n"
            "3. Alternatively download via Kaggle: https://www.kaggle.com/datasets/anlgrbz/student-demographics-online-education-dataoulad\n"
            "4. Place the extracted tables into ml-service/datasets/raw/oulad/."
        )
    }
}
