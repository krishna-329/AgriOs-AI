import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from sqlalchemy.engine import make_url

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

def resolve_database_url(value: str | None, production: bool) -> str:
    if not value or not value.strip():
        if production:
            raise ValueError("DATABASE_URL is required in production; configure persistent PostgreSQL")
        return "sqlite:///./agrios.db"
    try:
        url = make_url(value.strip())
    except Exception:
        raise ValueError("DATABASE_URL is not a valid database connection URL") from None
    if url.drivername in {"postgres", "postgresql", "postgresql+psycopg"}:
        url = url.set(drivername="postgresql+psycopg")
        if production and url.query.get("sslmode") not in {"require", "verify-ca", "verify-full"}:
            raise ValueError("Production DATABASE_URL must enable TLS using sslmode=require or verification")
    elif url.get_backend_name() != "sqlite" or production:
        raise ValueError("Production requires PostgreSQL; SQLite is supported only for local development")
    return url.render_as_string(hide_password=False)

class Settings(BaseModel):
    production: bool = bool(os.getenv("VERCEL")) or os.getenv("APP_ENV", "development").lower() == "production"
    database_url: str = Field(default_factory=lambda: resolve_database_url(os.getenv("DATABASE_URL"), bool(os.getenv("VERCEL")) or os.getenv("APP_ENV", "development").lower() == "production"), repr=False)
    database_connect_timeout: int = Field(default=int(os.getenv("DATABASE_CONNECT_TIMEOUT", "10")), ge=1, le=60)
    database_init_lock_timeout: int = Field(default=int(os.getenv("DATABASE_INIT_LOCK_TIMEOUT", "30")), ge=1, le=120)
    cors_origins: list[str] = [v.strip() for v in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001").split(",") if v.strip()]
    weather_api_url: str = os.getenv("WEATHER_API_URL", "https://api.open-meteo.com/v1/forecast")
    weather_timeout_seconds: float = Field(default=float(os.getenv("WEATHER_TIMEOUT_SECONDS", "10")), gt=0, le=60)
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

settings = Settings()
