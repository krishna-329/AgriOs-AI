from datetime import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.database import get_session
from app.db.bootstrap import initialize_database, DEMO_FARM_ID
from app.db.models import Farm, WeatherReading
from app.services.weather_service import get_weather_service
from app.schemas.weather import WeatherResponse

@pytest.fixture
def farm_client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    initialize_database(engine)
    def sessions():
        with Session(engine) as session: yield session
    app.dependency_overrides[get_session] = sessions
    try:
        with TestClient(app) as client: yield client, engine
    finally:
        app.dependency_overrides.clear()
        engine.dispose()

def profile():
    return dict(name="South Farm", farmer_name="Anita", location_name="Hyderabad", district="Hyderabad", state="Telangana", latitude=17.385, longitude=78.4867, area_acres=10, soil_type="Clay", soil_ph=6.5, nitrogen=40, phosphorus=20, potassium=30, irrigation_type="Drip", water_availability=2000, current_crop="Paddy", crop_variety="Test variety", sowing_date="2026-06-01", budget=100000)

def test_create_read_update_and_restart(farm_client):
    client, engine = farm_client
    demo = client.get("/api/farms").json()
    assert len(demo) == 1 and demo[0]["name"] == "Green Valley Farm"
    assert demo[0]["area_acres"] == 10 and demo[0]["current_crop"] == "Paddy"
    response = client.post("/api/farms", json=profile())
    assert response.status_code == 201
    saved = response.json()
    assert {key: saved[key] for key in profile()} == profile()
    assert saved["created_at"].endswith("Z")
    assert client.get(f"/api/farms/{saved['id']}").json() == saved
    changed = {**profile(), "name": "Edited Farm", "budget": 0, "soil_ph": None, "current_crop": None}
    updated = client.put(f"/api/farms/{saved['id']}", json=changed).json()
    assert updated["created_at"] == saved["created_at"]
    assert updated["updated_at"] >= saved["updated_at"]
    initialize_database(engine)
    assert client.get(f"/api/farms/{saved['id']}").json() == updated
    assert len(client.get("/api/farms").json()) == 2

@pytest.mark.parametrize("change", [{"name":"   "}, {"latitude":91}, {"longitude":181}, {"latitude":None}, {"area_acres":0}, {"soil_ph":14.1}, {"nitrogen":-1}, {"phosphorus":-1}, {"potassium":-1}, {"water_availability":-1}, {"budget":-1}, {"sowing_date":"bad"}, {"unexpected":True}])
def test_validation(farm_client, change):
    client, _ = farm_client
    assert client.post("/api/farms", json={**profile(), **change}).status_code == 422
    assert client.put(f"/api/farms/{DEMO_FARM_ID}", json={**profile(), **change}).status_code == 422

def test_optional_fields_and_missing_farm(farm_client):
    client, _ = farm_client
    saved = client.post("/api/farms", json={"name":"Minimal farm", "farmer_name":"  "}).json()
    assert saved["latitude"] is None and saved["farmer_name"] is None
    assert client.get("/api/farms/missing").status_code == 404
    assert client.put("/api/farms/missing", json=profile()).status_code == 404
    cors = client.options(f"/api/farms/{saved['id']}", headers={"Origin":"http://127.0.0.1:3001", "Access-Control-Request-Method":"PUT", "Access-Control-Request-Headers":"content-type"})
    assert cors.status_code == 200 and "PUT" in cors.headers["access-control-allow-methods"]

def test_weather_uses_selected_farm_and_avoids_ambiguous_coordinates(farm_client):
    client, engine = farm_client
    saved = client.post("/api/farms", json=profile()).json()
    second = client.post("/api/farms", json={**profile(), "name":"Neighbour"}).json()
    calls = []
    class Stub:
        async def get_weather(self, latitude, longitude):
            calls.append((latitude, longitude))
            return WeatherResponse(latitude=latitude, longitude=longitude, temperature=31, humidity=60, wind_speed=10, condition="Clear sky", timestamp=datetime.fromisoformat("2026-10-07T06:00:00+00:00"), timezone="Asia/Kolkata")
    app.dependency_overrides[get_weather_service] = Stub
    params = {"farm_id":second["id"], "latitude":17.385, "longitude":78.4867}
    assert client.get("/api/weather", params=params).status_code == 200
    with Session(engine) as session:
        assert session.scalar(select(WeatherReading)).farm_id == second["id"]
    client.put(f"/api/farms/{second['id']}", json={**profile(), "latitude":10, "longitude":79})
    assert client.get("/api/weather", params=params).status_code == 409
    assert client.get("/api/weather", params={**params, "latitude":10, "longitude":79}).status_code == 200
    assert calls == [(17.385,78.4867),(10,79)]
    assert client.get("/api/weather", params={**params,"farm_id":"missing"}).status_code == 404

def test_no_demo_insertion_when_non_demo_farm_exists(farm_client):
    client, engine = farm_client
    with Session(engine) as session:
        farm = session.get(Farm, DEMO_FARM_ID)
        farm.id = "real-farm"
        session.commit()
    initialize_database(engine)
    with Session(engine) as session:
        assert session.scalar(select(func.count()).select_from(Farm)) == 1
        assert session.get(Farm, DEMO_FARM_ID) is None
