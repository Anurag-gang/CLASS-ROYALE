"""
Dataset Downloader & Extraction Engine
Handles resumable HTTP streaming downloads, SHA256 calculation, and safe archive extraction.
"""

import hashlib
import os
import shutil
import time
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

import yaml
from .config import DATASET_SPECS, METADATA_DIR, RAW_DIR


def calculate_sha256(filepath: Path, chunk_size: int = 1024 * 1024) -> str:
    """Calculate SHA256 checksum in 1MB chunks."""
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            sha.update(chunk)
    return sha.hexdigest()


def download_file(
    url: str,
    target_path: Path,
    expected_size: Optional[int] = None,
    resume: bool = True,
    chunk_size: int = 1024 * 1024,  # 1MB chunks
) -> Dict[str, Any]:
    """
    Download a file via HTTP streaming with resume support where available.
    """
    target_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = target_path.with_suffix(target_path.suffix + ".part")

    existing_bytes = 0
    if resume and temp_path.exists():
        existing_bytes = temp_path.stat().st_size

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ClassRoyaleML/1.0",
    }
    if existing_bytes > 0:
        headers["Range"] = f"bytes={existing_bytes}-"

    req = urllib.request.Request(url, headers=headers)
    
    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            status_code = response.getcode()
            total_size_header = response.headers.get("Content-Length")
            
            if status_code == 206:  # Partial Content
                total_bytes = existing_bytes + int(total_size_header) if total_size_header else None
                mode = "ab"
                downloaded_bytes = existing_bytes
                print(f"Resuming download from byte {existing_bytes:,}...")
            else:
                total_bytes = int(total_size_header) if total_size_header else expected_size
                mode = "wb"
                downloaded_bytes = 0
                if existing_bytes > 0:
                    print("Server does not support Range requests. Restarting download...")

            with open(temp_path, mode) as f:
                last_print = time.time()
                while True:
                    chunk = response.read(chunk_size)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded_bytes += len(chunk)

                    now = time.time()
                    if now - last_print > 2.0:
                        speed = (downloaded_bytes - (existing_bytes if mode == 'ab' else 0)) / max(1e-5, now - start_time) / (1024 * 1024)
                        if total_bytes:
                            pct = (downloaded_bytes / total_bytes) * 100.0
                            print(f"Progress: {downloaded_bytes / (1024*1024):.1f} MB / {total_bytes / (1024*1024):.1f} MB ({pct:.1f}%) @ {speed:.2f} MB/s")
                        else:
                            print(f"Progress: {downloaded_bytes / (1024*1024):.1f} MB downloaded @ {speed:.2f} MB/s")
                        last_print = now

        # Move partial file to final target
        if target_path.exists():
            target_path.unlink()
        temp_path.rename(target_path)

        elapsed = time.time() - start_time
        file_size = target_path.stat().st_size
        print(f"Download complete: {target_path.name} ({file_size / (1024*1024):.2f} MB) in {elapsed:.1f}s")
        
        checksum = calculate_sha256(target_path)
        return {
            "success": True,
            "filepath": str(target_path),
            "file_size": file_size,
            "sha256": checksum,
            "download_time_seconds": elapsed,
        }

    except Exception as e:
        print(f"Download failed for {url}: {e}")
        return {
            "success": False,
            "error": str(e),
            "filepath": str(target_path),
            "partial_bytes": temp_path.stat().st_size if temp_path.exists() else 0,
        }


def safe_extract_zip(zip_path: Path, target_dir: Path) -> list:
    """Safely extract zip archive preventing path traversal."""
    target_dir.mkdir(parents=True, exist_ok=True)
    extracted_files = []
    
    with zipfile.ZipFile(zip_path, 'r') as zf:
        for member in zf.infolist():
            # Check for path traversal attacks
            member_path = Path(member.filename)
            if ".." in member_path.parts or member_path.is_absolute():
                print(f"Security Warning: Skipping malicious archive entry: {member.filename}")
                continue
            
            dest_file = target_dir / member_path
            if member.is_dir():
                dest_file.mkdir(parents=True, exist_ok=True)
            else:
                dest_file.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(member) as source, open(dest_file, "wb") as target:
                    shutil.copyfileobj(source, target)
                extracted_files.append(str(dest_file))
                
    return extracted_files


def download_dataset(dataset_key: str) -> Dict[str, Any]:
    """Download, verify, and extract a specified dataset."""
    if dataset_key not in DATASET_SPECS:
        raise ValueError(f"Unknown dataset '{dataset_key}'. Available: {list(DATASET_SPECS.keys())}")

    spec = DATASET_SPECS[dataset_key]
    
    # Check if manual action is required
    if not spec.get("is_automatic", True) or not spec.get("download_url"):
        print(f"[{spec['name']}] Requires manual action: {spec.get('status')}")
        print(spec.get("instructions", "No instructions available."))
        return {
            "dataset": dataset_key,
            "status": "DOWNLOAD_REQUIRES_MANUAL_ACTION",
            "message": spec.get("instructions"),
        }

    raw_dir: Path = spec["raw_dir"]
    raw_dir.mkdir(parents=True, exist_ok=True)
    archive_path = raw_dir / spec.get("archive_name", f"{dataset_key}.zip")

    print(f"\n--- Initiating Acquisition: {spec['name']} ---")
    print(f"Source: {spec['source']}")
    print(f"URL: {spec['download_url']}")
    print(f"Target: {archive_path}")

    # Step 1: Download
    dl_result = download_file(spec["download_url"], archive_path)
    if not dl_result["success"]:
        return {
            "dataset": dataset_key,
            "status": "DATASET_DOWNLOAD_UNAVAILABLE",
            "error": dl_result.get("error"),
            "manual_instructions": f"Download manually from {spec['official_url']} and place into {raw_dir}"
        }

    # Step 2: Extraction
    print(f"Extracting {archive_path.name}...")
    extracted = safe_extract_zip(archive_path, raw_dir)
    print(f"Extracted {len(extracted)} files.")

    # Step 3: Write metadata record
    meta_path = METADATA_DIR / f"{dataset_key}.yaml"
    metadata_content = {
        "dataset_name": spec["name"],
        "full_name": spec["full_name"],
        "source": spec["source"],
        "source_url": spec["official_url"],
        "official_repository": spec.get("official_url"),
        "download_url": spec["download_url"],
        "download_timestamp": datetime.now(timezone.utc).isoformat(),
        "license": spec["license"],
        "license_url": spec["license_url"],
        "file_size_bytes": dl_result["file_size"],
        "checksum_sha256": dl_result["sha256"],
        "archive_path": str(archive_path),
        "extracted_file_count": len(extracted),
        "source_type": "REAL",
        "intended_use": "Class Royale supervised adaptive learning foundation",
        "notes": f"Acquired from official source without modification. Raw files preserved in {raw_dir}."
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        yaml.dump(metadata_content, f, sort_keys=False, default_flow_style=False)

    print(f"Metadata recorded: {meta_path}")

    return {
        "dataset": dataset_key,
        "status": "EXTRACTED",
        "file_size": dl_result["file_size"],
        "sha256": dl_result["sha256"],
        "extracted_files": extracted[:10],
        "metadata_file": str(meta_path)
    }
