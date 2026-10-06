"""
Download EdNet-KT1 official zip with chunking, resume support, and progress updates.
"""
import sys
from pathlib import Path

# Add ml-service to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dataset_manager.downloader import download_file, calculate_sha256
from dataset_manager.config import DATASET_SPECS, METADATA_DIR
import yaml
from datetime import datetime, timezone

def run():
    spec = DATASET_SPECS["ednet_kt1"]
    raw_dir = spec["raw_dir"]
    raw_dir.mkdir(parents=True, exist_ok=True)
    archive_path = raw_dir / "EdNet-KT1.zip"

    print("=" * 60)
    print("STARTING EDNET-KT1 DOWNLOAD")
    print(f"URL: {spec['download_url']}")
    print(f"Destination: {archive_path}")
    print("=" * 60)

    # 1. Check if already completely downloaded
    if archive_path.exists() and archive_path.stat().st_size == 1201163816:
        print(f"EdNet-KT1.zip already fully downloaded ({archive_path.stat().st_size} bytes).")
        checksum = calculate_sha256(archive_path)
        print(f"SHA256: {checksum}")
    else:
        res = download_file(spec["download_url"], archive_path, expected_size=1201163816, resume=True)
        if not res["success"]:
            print("Download failed:", res.get("error"))
            sys.exit(1)
        checksum = res["sha256"]

    # Record metadata
    meta_path = METADATA_DIR / "ednet_kt1.yaml"
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
        "file_size_bytes": archive_path.stat().st_size,
        "checksum_sha256": checksum,
        "archive_path": str(archive_path),
        "source_type": "REAL",
        "intended_use": "Class Royale supervised adaptive learning foundation",
        "notes": "Acquired from official Riiid EdNet Google Drive mirror. Large-scale student interaction log."
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        yaml.dump(metadata_content, f, sort_keys=False, default_flow_style=False)
    print(f"Metadata recorded at {meta_path}")

if __name__ == "__main__":
    run()
