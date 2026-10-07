import asyncio
from copy import deepcopy
import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select, func, text
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.database import get_session
from app.db.bootstrap import initialize_database, DEMO_FARM_ID
from app.db.models import Farm, WeatherReading
from app.services.weather_service import WeatherService, WeatherUnavailable, normalize, get_weather_service

PAYLOAD = {"utc_offset_seconds": 19800, "timezone": "Asia/Kolkata", "current": {"time": "2026-10-07T12:00", "temperature_2m": 30.4, "relative_humidity_2m": 62, "wind_speed_10m": 12, "weather_code": 2}, "daily": {"time": [f"2026-10-{d}" for d in range(7,12)], "temperature_2m_max": [32]*5, "temperature_2m_min": [24]*5, "precipitation_probability_max": [20]*5, "weather_code": [2]*5}}
PAYLOAD["daily"]["time"] = [f"2026-10-{d:02}" for d in range(7,12)]

def test_normalization():
    result = normalize(PAYLOAD, 17.385, 78.4867)
    assert result.temperature == 30.4 and result.condition == "Partly cloudy"
    assert result.timestamp.isoformat() == "2026-10-07T06:30:00+00:00"
    assert result.rain_probability == 20 and len(result.forecast) == 5
    assert result.source == "weather_api" and result.wind_speed_unit == "km/h"
    payload = deepcopy(PAYLOAD)
    payload.pop("daily")
    assert normalize(payload, 0, 0).rain_probability is None

@pytest.mark.parametrize("failure,expected", [("timeout",504), ("http",502), ("malformed",502), ("null",502)])
def test_provider_failures(failure, expected):
    def handler(request):
        if failure == "timeout": raise httpx.ReadTimeout("timeout", request=request)
        if failure == "http": return httpx.Response(429)
        payload = deepcopy(PAYLOAD)
        if failure == "malformed": payload = {}
        if failure == "null": payload["current"]["temperature_2m"] = None
        return httpx.Response(200, json=payload)
    service = WeatherService(httpx.MockTransport(handler))
    with pytest.raises(WeatherUnavailable) as exc:
        asyncio.run(service.get_weather(0,0))
    assert exc.value.status_code == expected

def test_routes_persistence_and_errors():
    engine = create_engine("sqlite://", connect_args={"check_same_thread":False}, poolclass=StaticPool)
    initialize_database(engine)
    initialize_database(engine)
    def sessions():
        with Session(engine) as session: yield session
    service = WeatherService(httpx.MockTransport(lambda request: httpx.Response(200,json=PAYLOAD)))
    app.dependency_overrides[get_session] = sessions
    app.dependency_overrides[get_weather_service] = lambda: service
    try:
        with TestClient(app) as client:
            assert client.get("/health").json() == {"status":"ok"}
            farm = client.get("/api/farms/demo").json()
            response = client.get("/api/weather", params={"latitude":farm["latitude"], "longitude":farm["longitude"]}, headers={"Origin":"http://127.0.0.1:3001"})
            assert response.status_code == 200
            assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:3001"
            with Session(engine) as session:
                assert session.scalar(select(func.count()).select_from(Farm)) == 1
                assert session.scalar(select(WeatherReading)).farm_id == DEMO_FARM_ID
            assert client.get("/api/weather?latitude=91&longitude=0").status_code == 422
            assert client.get("/api/weather?latitude=nan&longitude=0").status_code == 422
            assert client.get("/api/weather").status_code == 422
            client.get("/api/weather?latitude=17.385&longitude=78.4867")
            with Session(engine) as session:
                assert session.scalar(select(WeatherReading).where(WeatherReading.latitude == 17.385)).farm_id is None
            class Failing:
                async def get_weather(self, *args): raise WeatherUnavailable(504)
            app.dependency_overrides[get_weather_service] = Failing
            response = client.get("/api/weather?latitude=0&longitude=0")
            assert response.status_code == 504
            assert response.json()["detail"] == "Weather temporarily unavailable"
    finally:
        app.dependency_overrides.clear()
        engine.dispose()

def test_legacy_farm_migration():
    engine = create_engine("sqlite://")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE farms (id VARCHAR(36) PRIMARY KEY, profile JSON NOT NULL, created_at DATETIME NOT NULL)"))
        connection.execute(text("INSERT INTO farms VALUES (:id,:profile,:created)"), dict(id="old", profile='{"name":"Old farm","area_ha":2,"location":"Guntur"}', created="2026-01-01 00:00:00"))
    initialize_database(engine)
    with Session(engine) as session:
        farm = session.get(Farm,"old")
        assert farm.name == "Old farm" and farm.area == 2
        assert farm.latitude is None
    engine.dispose()
