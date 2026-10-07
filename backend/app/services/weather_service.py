import logging
from datetime import datetime, timezone, timedelta
import httpx
from pydantic import ValidationError
from app.config import settings
from app.schemas.weather import WeatherResponse, ForecastDay

logger = logging.getLogger(__name__)

class WeatherUnavailable(Exception):
    def __init__(self, status_code=502):
        self.status_code = status_code

CONDITIONS = {0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle", 56: "Freezing drizzle", 57: "Freezing drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain", 67: "Heavy freezing rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains", 80: "Rain showers", 81: "Rain showers", 82: "Heavy rain showers", 85: "Snow showers", 86: "Heavy snow showers", 95: "Thunderstorm", 96: "Thunderstorm with hail", 97: "Heavy thunderstorm", 99: "Thunderstorm with hail"}

def normalize(payload: dict, latitude: float, longitude: float) -> WeatherResponse:
    current = payload["current"]
    offset = timezone(timedelta(seconds=payload["utc_offset_seconds"]))
    timestamp = datetime.fromisoformat(current["time"]).replace(tzinfo=offset).astimezone(timezone.utc)
    daily = payload.get("daily") or {}
    forecast = [ForecastDay(date=day, temperature_max=daily["temperature_2m_max"][i], temperature_min=daily["temperature_2m_min"][i], rain_probability=daily["precipitation_probability_max"][i], condition=CONDITIONS.get(daily["weather_code"][i], "Unknown")) for i, day in enumerate(daily.get("time", [])[:5])]
    return WeatherResponse(latitude=latitude, longitude=longitude, temperature=current["temperature_2m"], humidity=current["relative_humidity_2m"], wind_speed=current["wind_speed_10m"], rain_probability=forecast[0].rain_probability if forecast else None, condition=CONDITIONS.get(current["weather_code"], "Unknown"), timestamp=timestamp, timezone=payload["timezone"], forecast=forecast)

class WeatherService:
    def __init__(self, transport=None):
        self.transport = transport

    async def get_weather(self, latitude: float, longitude: float) -> WeatherResponse:
        params = dict(latitude=latitude, longitude=longitude, current="temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m", daily="weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max", timezone="auto", forecast_days=5, temperature_unit="celsius", wind_speed_unit="kmh")
        try:
            async with httpx.AsyncClient(timeout=settings.weather_timeout_seconds, transport=self.transport) as client:
                response = await client.get(settings.weather_api_url, params=params)
                response.raise_for_status()
                result = normalize(response.json(), latitude, longitude)
                logger.info("Weather provider request succeeded")
                return result
        except httpx.TimeoutException as exc:
            logger.warning("Weather provider timed out")
            raise WeatherUnavailable(504) from exc
        except (httpx.HTTPError, ValueError, KeyError, TypeError, IndexError, ValidationError) as exc:
            logger.warning("Weather provider failed: %s", type(exc).__name__)
            raise WeatherUnavailable() from exc

def get_weather_service():
    return WeatherService()
