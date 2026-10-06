"""
Dataset Manager CLI Interface
Commands:
  python -m dataset_manager download <dataset_name>
  python -m dataset_manager status
  python -m dataset_manager verify <dataset_name>
  python -m dataset_manager inspect <dataset_name>
  python -m dataset_manager normalize <dataset_name>
"""

import argparse
import json
import sys
from pathlib import Path

from .config import DATASET_SPECS
from .downloader import download_dataset
from .verifier import verify_dataset_checksum, verify_all_datasets
from .status import get_dataset_status, get_all_statuses
from .inspector import inspect_dataset
from .normalizer import normalize_dataset, normalize_all


def main():
    parser = argparse.ArgumentParser(
        prog="dataset_manager",
        description="Class Royale Educational Dataset Acquisition & Normalization Manager"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # 1. Download command
    dl_parser = subparsers.add_parser("download", help="Download and extract official dataset")
    dl_parser.add_argument("dataset", choices=list(DATASET_SPECS.keys()) + ["all"], help="Dataset key or 'all'")

    # 2. Status command
    status_parser = subparsers.add_parser("status", help="Check lifecycle status of datasets")
    status_parser.add_argument("dataset", nargs="?", default="all", help="Optional dataset key or 'all'")

    # 3. Verify command
    verify_parser = subparsers.add_parser("verify", help="Verify SHA256 checksum and structure")
    verify_parser.add_argument("dataset", nargs="?", default="all", help="Dataset key or 'all'")

    # 4. Inspect command
    inspect_parser = subparsers.add_parser("inspect", help="Run deep statistical inspection")
    inspect_parser.add_argument("dataset", choices=["mathe", "ednet_kt1", "all"], help="Dataset to inspect")

    # 5. Normalize command
    norm_parser = subparsers.add_parser("normalize", help="Normalize dataset into canonical Class Royale schema")
    norm_parser.add_argument("dataset", choices=["mathe", "ednet_kt1", "all"], help="Dataset to normalize")
    norm_parser.add_argument("--cohort-students", type=int, default=500, help="Cohort size for EdNet-KT1")

    args = parser.parse_args()

    print("=" * 65)
    print(f"CLASS ROYALE DATASET MANAGER :: {args.command.upper()}")
    print("=" * 65)

    if args.command == "download":
        if args.dataset == "all":
            for d in ["mathe", "ednet_contents", "ednet_kt1"]:
                print(f"\nProcessing {d}...")
                res = download_dataset(d)
                print(json.dumps(res, indent=2, default=str))
        else:
            res = download_dataset(args.dataset)
            print(json.dumps(res, indent=2, default=str))

    elif args.command == "status":
        if args.dataset == "all":
            res = get_all_statuses()
        else:
            res = get_dataset_status(args.dataset)
        print(json.dumps(res, indent=2, default=str))

    elif args.command == "verify":
        if args.dataset == "all":
            res = verify_all_datasets()
        else:
            res = verify_dataset_checksum(args.dataset)
        print(json.dumps(res, indent=2, default=str))

    elif args.command == "inspect":
        if args.dataset == "all":
            res = {d: inspect_dataset(d) for d in ["mathe", "ednet_kt1"]}
        else:
            res = inspect_dataset(args.dataset)
        print(json.dumps(res, indent=2, default=str))

    elif args.command == "normalize":
        if args.dataset == "all":
            res = normalize_all()
        else:
            res = normalize_dataset(args.dataset, cohort_students=args.cohort_students)
        print(json.dumps(res, indent=2, default=str))


if __name__ == "__main__":
    main()
