"""Application settings, loaded from environment variables (prefix ``NIKITA_``).

Secrets are typed as ``SecretStr`` so they are never rendered by ``repr()`` or logs.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="NIKITA_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: Literal["development", "test", "production"] = "development"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    log_json: bool = Field(default=False, description="Emit JSON logs (use in containers).")

    database_url: str = "postgresql+asyncpg://nikita:nikita@localhost:5432/nikita"
    redis_url: str = "redis://localhost:6379/0"

    # Signs session cookies and CSRF tokens. MUST be overridden outside development.
    secret_key: SecretStr = SecretStr("dev-insecure-change-me")

    # Used only by the backend orchestrator (Phase 4). Never exposed to the frontend.
    anthropic_api_key: SecretStr | None = None

    data_dir: Path = Path("./var/data")
    upload_max_bytes: int = 512 * 1024 * 1024

    health_check_timeout_s: float = 2.0

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    def validate_for_runtime(self) -> None:
        """Fail fast on dangerous production configuration."""
        if self.is_production and self.secret_key.get_secret_value() == "dev-insecure-change-me":
            raise RuntimeError("NIKITA_SECRET_KEY must be set in production")


@lru_cache
def get_settings() -> Settings:
    return Settings()
