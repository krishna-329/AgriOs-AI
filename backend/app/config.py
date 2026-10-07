import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

class Settings(BaseModel):
    database_url: str = os.getenv("DATABASE_URL", "sqlite:////tmp/agrios.db" if os.getenv("VERCEL") else "sqlite:///./agrios.db")
    cors_origins: list[str] = [v.strip() for v in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001").split(",") if v.strip()]
    weather_api_url: str = os.getenv("WEATHER_API_URL", "https://api.open-meteo.com/v1/forecast")
    weather_timeout_seconds: float = Field(default=float(os.getenv("WEATHER_TIMEOUT_SECONDS", "10")), gt=0, le=60)
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

settings = Settings()
