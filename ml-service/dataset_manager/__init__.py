"""
Class Royale Dataset Manager Package
"""

from .config import DATASET_SPECS, RAW_DIR, PROCESSED_DIR, METADATA_DIR, REPORTS_DIR
from .downloader import download_dataset, download_file, calculate_sha256
from .verifier import verify_dataset_checksum, verify_all_datasets
from .status import get_dataset_status, get_all_statuses
from .inspector import inspect_dataset
from .normalizer import normalize_dataset, normalize_all

__all__ = [
    "DATASET_SPECS",
    "RAW_DIR",
    "PROCESSED_DIR",
    "METADATA_DIR",
    "REPORTS_DIR",
    "download_dataset",
    "download_file",
    "calculate_sha256",
    "verify_dataset_checksum",
    "verify_all_datasets",
    "get_dataset_status",
    "get_all_statuses",
    "inspect_dataset",
    "normalize_dataset",
    "normalize_all",
]
