"""
Dataset Status Reporter
Enumerates status of all datasets:
DOWNLOADED, PARTIALLY_DOWNLOADED, EXTRACTED, VALIDATED, UNAVAILABLE, REQUIRES_MANUAL_DOWNLOAD.
"""

from pathlib import Path
from typing import Dict, Any, List
import yaml

from .config import DATASET_SPECS, METADATA_DIR, RAW_DIR, PROCESSED_DIR


def get_dataset_status(dataset_key: str) -> Dict[str, Any]:
    """Evaluates the lifecycle state of a dataset."""
    if dataset_key not in DATASET_SPECS:
        raise ValueError(f"Unknown dataset '{dataset_key}'")

    spec = DATASET_SPECS[dataset_key]
    
    # 1. Check if dataset requires manual action
    if not spec.get("is_automatic"):
        raw_dir: Path = spec["raw_dir"]
        has_files = raw_dir.exists() and any(raw_dir.iterdir())
        if has_files:
            return {
                "dataset": dataset_key,
                "name": spec["name"],
                "state": "DOWNLOADED_MANUALLY",
                "category": spec["category"],
                "license": spec["license"],
                "location": str(raw_dir)
            }
        return {
            "dataset": dataset_key,
            "name": spec["name"],
            "state": "DOWNLOAD_REQUIRES_MANUAL_ACTION",
            "category": spec["category"],
            "license": spec["license"],
            "instructions": spec.get("instructions"),
            "official_url": spec.get("official_url")
        }

    raw_dir: Path = spec["raw_dir"]
    archive_name = spec.get("archive_name")
    archive_path = raw_dir / archive_name if archive_name else None
    meta_path = METADATA_DIR / f"{dataset_key}.yaml"
    proc_dir: Path = spec["processed_dir"]

    # Check partial file
    if archive_path:
        part_file = archive_path.with_suffix(archive_path.suffix + ".part")
        if part_file.exists():
            return {
                "dataset": dataset_key,
                "name": spec["name"],
                "state": "PARTIALLY_DOWNLOADED",
                "bytes": part_file.stat().st_size,
                "partial_file": str(part_file)
            }

    # Check if archive exists
    archive_exists = archive_path.exists() if archive_path else False

    # Check if extracted files exist
    extracted = False
    if raw_dir.exists():
        files = [f for f in raw_dir.iterdir() if f.is_file() and not f.name.endswith(".zip") and not f.name.endswith(".part")]
        extracted = len(files) > 0 or (dataset_key == "ednet_kt1" and archive_exists)

    # Check if normalized data exists in processed_dir
    normalized = False
    if proc_dir.exists():
        proc_files = list(proc_dir.glob("*.parquet")) + list(proc_dir.glob("*.csv"))
        normalized = len(proc_files) > 0

    # Determine state
    if normalized:
        state = "VALIDATED_AND_NORMALIZED"
    elif extracted and meta_path.exists():
        state = "VALIDATED"
    elif extracted:
        state = "EXTRACTED"
    elif archive_exists:
        state = "DOWNLOADED"
    else:
        state = "UNAVAILABLE"

    return {
        "dataset": dataset_key,
        "name": spec["name"],
        "state": state,
        "category": spec["category"],
        "license": spec["license"],
        "source": spec["source"],
        "raw_dir": str(raw_dir),
        "processed_dir": str(proc_dir),
        "archive_size": archive_path.stat().st_size if archive_exists else 0,
        "has_metadata": meta_path.exists(),
        "is_normalized": normalized
    }


def get_all_statuses() -> Dict[str, Any]:
    """Returns status report for all primary and secondary datasets."""
    statuses = {}
    for key in DATASET_SPECS.keys():
        statuses[key] = get_dataset_status(key)
    return statuses
