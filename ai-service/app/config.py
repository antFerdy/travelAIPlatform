from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str | None = None
    openai_model: str = "gpt-5-mini"
    backend_url: str = "http://localhost:8080"
    # Used to build clickable tour links in chat replies (frontend_url + /tours/{id}).
    frontend_url: str = "http://localhost:5173"
    memory_db_path: Path = Path("runtime/memory.db")
    request_timeout_seconds: float = Field(default=5.0, gt=0, le=30)

    # Браузер ходит в /chat напрямую, поэтому origin фронтенда должен быть
    # разрешён явно. Список задаётся JSON-массивом в ALLOWED_ORIGINS,
    # локальная разработка покрыта регуляркой: порт vite-сервера плавает.
    allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    allowed_origin_regex: str = r"^http://(localhost|127\.0\.0\.1)(:\d+)?$"
