"""
Class Royale Machine Learning Service - Configuration Settings
Zero external dependency fallback (uses pydantic.BaseModel and os.environ).
"""

import os
from pathlib import Path
from typing import List
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class Settings(BaseModel):
    # Environment & Operating Modes
    ml_env: str = Field(default_factory=lambda: os.getenv("ML_ENV", "development"))
    ml_mode: str = Field(default_factory=lambda: os.getenv("ML_MODE", "active"))
    demo_mode: bool = Field(default_factory=lambda: os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes"))

    # API Host & Server
    api_title: str = "Class Royale Adaptive Learning ML Service"
    api_version: str = "0.1.0"
    api_description: str = (
        "Dataset-agnostic supervised machine learning foundation for student mastery, "
        "question difficulty, weak topic identification, and next question recommendation."
    )
    api_host: str = Field(default_factory=lambda: os.getenv("API_HOST", "0.0.0.0"))
    api_port: int = Field(default_factory=lambda: int(os.getenv("API_PORT", "8000")))
    api_reload: bool = Field(default_factory=lambda: os.getenv("API_RELOAD", "false").lower() in ("true", "1"))

    # Directory Paths
    base_dir: Path = Path(__file__).resolve().parent.parent.parent
    model_registry_path: Path = Path("artifacts/models")
    preprocessor_registry_path: Path = Path("artifacts/preprocessors")
    metadata_path: Path = Path("artifacts/metadata")
    dataset_path: Path = Path("datasets")

    # Logging
    log_level: str = Field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))

    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "*"]

    # Model Settings
    default_mastery_model_version: str = "v1.0.0"
    default_difficulty_model_version: str = "v1.0.0"
    default_topic_model_version: str = "v1.0.0"
    default_recommender_version: str = "v1.0.0"

    def resolve_path(self, relative_path: Path) -> Path:
        """Resolve a path relative to the base ml-service directory if not absolute."""
        if relative_path.is_absolute():
            return relative_path
        return self.base_dir / relative_path


# Global cached settings instance
settings = Settings()
