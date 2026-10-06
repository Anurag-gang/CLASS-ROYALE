"""
Semantic Model Versioning Utilities
"""

import re
from typing import Tuple


def parse_semantic_version(version_str: str) -> Tuple[int, int, int]:
    """Parses 'v1.2.3' or '1.2.3' into a tuple (1, 2, 3)."""
    cleaned = version_str.strip().lstrip("v").lstrip("V")
    match = re.match(r"^(\d+)\.(\d+)\.(\d+)$", cleaned)
    if not match:
        raise ValueError(f"Invalid semantic version format: '{version_str}'. Expected format: 'v1.0.0'")
    return int(match.group(1)), int(match.group(2)), int(match.group(3))


def is_valid_version(version_str: str) -> bool:
    try:
        parse_semantic_version(version_str)
        return True
    except ValueError:
        return False
