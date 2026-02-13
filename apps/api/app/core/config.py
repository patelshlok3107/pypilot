import os
import socket
from functools import lru_cache
from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    secret_key: str = "change-this-in-prod"
    access_token_expire_minutes: int = 60 * 24 * 7
    auth_cookie_name: str = "pypilot_session"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"

    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_db: str = "edtech"
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    # Local Offline LLM Configuration (Ollama)
    use_offline_ai: bool = False
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistral:latest"  # Install with: ollama pull mistral

    # Optional: Keep for fallback
    openai_api_key: Optional[str] = None
    openai_model: str = "google/gemini-flash-1.5"
    openai_base_url: str = "https://openrouter.ai/api/v1"

    code_runner_url: str = "http://localhost:8100"

    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    stripe_price_id: str = "price_12345"
    stripe_price_id_annual: Optional[str] = None

    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Optional SMTP settings for sending parent reports with audio attachments
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    # Optional contact for product designer to include in welcome emails
    designer_email: str | None = None

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return ["http://localhost:3000"]

    @property
    def database_url(self) -> str:
        explicit_database_url = os.getenv("DATABASE_URL")
        if explicit_database_url:
            return explicit_database_url

        # The compose host "db" is not resolvable in non-docker local runs.
        # Fall back to SQLite so auth/progress flows still work locally.
        if self.postgres_host == "db":
            try:
                socket.gethostbyname(self.postgres_host)
            except OSError:
                return "sqlite:///./pypilot.db"

        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
