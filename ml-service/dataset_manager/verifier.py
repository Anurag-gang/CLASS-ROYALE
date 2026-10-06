"""
Dataset Verifier
Validates checksums, raw archive integrity, and presence of mandatory fields.
"""

from pathlib import Path
from typing import Dict, Any, List
import yaml

from .config import DATASET_SPECS, METADATA_DIR
from .downloader import calculate_sha256


def verify_dataset_checksum(dataset_key: str) -> Dict[str, Any]:
    """Verifies that downloaded archive matches the recorded SHA256 checksum."""
    if dataset_key not in DATASET_SPECS:
        raise ValueError(f"Unknown dataset '{dataset_key}'")

    meta_file = METADATA_DIR / f"{dataset_key}.yaml"
    if not meta_file.exists():
        return {
            "dataset": dataset_key,
            "status": "UNVERIFIED",
            "message": f"Metadata file not found: {meta_file}"
        }

    with open(meta_file, "r", encoding="utf-8") as f:
        meta = yaml.safe_load(f)

    archive_path_str = meta.get("archive_path")
    if not archive_path_str:
        return {
            "dataset": dataset_key,
            "status": "NO_ARCHIVE_PATH",
            "message": "Metadata does not contain archive_path"
        }

    archive_path = Path(archive_path_str)
    if not archive_path.exists():
        return {
            "dataset": dataset_key,
            "status": "ARCHIVE_MISSING",
            "message": f"Archive file does not exist: {archive_path}"
        }

    expected_sha = meta.get("checksum_sha256")
    actual_sha = calculate_sha256(archive_path)

    is_valid = (expected_sha == actual_sha)
    return {
        "dataset": dataset_key,
        "status": "CHECKSUM_VALID" if is_valid else "CHECKSUM_MISMATCH",
        "expected_sha256": expected_sha,
        "actual_sha256": actual_sha,
        "file_size": archive_path.stat().st_size,
        "is_valid": is_valid
    }


def verify_all_datasets() -> Dict[str, Any]:
    """Verifies all configured datasets."""
    results = {}
    for key, spec in DATASET_SPECS.items():
        if spec.get("is_automatic"):
            results[key] = verify_dataset_checksum(key)
        else:
            results[key] = {
                "dataset": key,
                "status": spec.get("status", "REQUIRES_MANUAL_DOWNLOAD"),
                "is_valid": False,
                "notes": "Manual registration required."
            }
    return results
