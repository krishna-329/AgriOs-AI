from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

class ForecastDay(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    date: date
    temperature_max: float
    temperature_min: float
    rain_probability: float | None = Field(default=None, ge=0, le=100)
    condition: str

class WeatherResponse(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    latitude: float
    longitude: float
    temperature: float
    humidity: float = Field(ge=0, le=100)
    rain_probability: float | None = Field(default=None, ge=0, le=100)
    rain_probability_period: Literal["today"] = "today"
    wind_speed: float = Field(ge=0)
    condition: str
    source: Literal["weather_api"] = "weather_api"
    provider: str = "Open-Meteo"
    timestamp: datetime
    timezone: str
    temperature_unit: Literal["°C"] = "°C"
    wind_speed_unit: Literal["km/h"] = "km/h"
    forecast: list[ForecastDay] = Field(default_factory=list, max_length=5)

class DemoFarm(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    latitude: float
    longitude: float
    area: float
    location_name: str
    created_at: datetime
