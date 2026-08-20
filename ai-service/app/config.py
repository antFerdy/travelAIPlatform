from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str | None = None
    openai_model: str = "gpt-5-mini"
    backend_url: str = "http://localhost:8080"
    memory_db_path: Path = Path("runtime/memory.db")
    request_timeout_seconds: float = Field(default=5.0, gt=0, le=30)
