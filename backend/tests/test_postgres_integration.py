"""Real PostgreSQL integration suite. Uses isolated disposable schemas only."""
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, text, inspect, MetaData, Table, Column, String, JSON, DateTime, Float
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session
import app.main as main_module
from app.config import resolve_database_url
from app.db.database import build_engine, get_session
from app.db.bootstrap import initialize_database
from app.db.models import Farm, WeatherReading, SensorReading
from app.schemas.weather import WeatherResponse
from app.services.weather_service import get_weather_service

@pytest.fixture
def postgres_engine():
    value = os.getenv("TEST_POSTGRES_URL")
    if not value: pytest.skip("TEST_POSTGRES_URL is required for real PostgreSQL tests")
    url = resolve_database_url(value, False)
    admin = build_engine(url)
    schema = "agrios_test_" + uuid4().hex
    with admin.begin() as connection: connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    scoped_url = make_url(url).update_query_dict({"options": f"-csearch_path={schema}"}).render_as_string(hide_password=False)
    engine = build_engine(scoped_url)
    try: yield engine, scoped_url
    finally:
        engine.dispose()
        # The generated schema belongs exclusively to this test fixture.
        with admin.begin() as connection: connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        admin.dispose()

@pytest.fixture
def pg_client(postgres_engine, monkeypatch):
    engine, _ = postgres_engine
    monkeypatch.setattr(main_module, "engine", engine)
    def sessions():
        with Session(engine) as session: yield session
    main_module.app.dependency_overrides[get_session] = sessions
    try:
        with TestClient(main_module.app) as client: yield client
    finally: main_module.app.dependency_overrides.clear()

def profile():
    return dict(name="Persistent test farm", farmer_name="Test farmer", latitude=17.385, longitude=78.4867, area_acres=10, soil_ph=6.5, current_crop="Paddy", sowing_date="2026-06-01", budget=100000)

def test_postgres_farm_weather_sensors_survive_reconnect(pg_client, postgres_engine):
    client = pg_client
    assert client.get("/health").json() == {"status":"ok"}
    created = client.post("/api/farms", json=profile())
    assert created.status_code == 201
    farm = created.json()
    updated = client.put(f"/api/farms/{farm['id']}", json={**profile(),"budget":200000}).json()
    assert updated["budget"] == 200000 and updated["created_at"] == farm["created_at"]
    assert client.get(f"/api/farms/{farm['id']}").json() == updated
    assert any(item["id"] == farm["id"] for item in client.get("/api/farms").json())
    class Stub:
        async def get_weather(self, latitude, longitude):
            return WeatherResponse(latitude=latitude, longitude=longitude, temperature=30, humidity=62, wind_speed=12, condition="Partly cloudy", timestamp=datetime.now(timezone.utc), timezone="Asia/Kolkata")
    main_module.app.dependency_overrides[get_weather_service] = Stub
    weather = client.get("/api/weather", params={"farm_id":farm["id"],"latitude":farm["latitude"],"longitude":farm["longitude"]})
    assert weather.status_code == 200
    for moisture in [40,42]:
        result = client.post("/api/sensors/readings", json=dict(farm_id=farm["id"], field_id="field-1", soil_moisture=moisture, temperature=30, humidity=60, source="simulator"))
        assert result.status_code == 201
    assert len(client.get("/api/sensors/history", params={"farm_id":farm["id"],"field_id":"field-1"}).json()) == 2
    assert client.get("/api/sensors/latest", params={"farm_id":farm["id"],"field_id":"field-1"}).json()["soil_moisture"] == 42
    original, url = postgres_engine
    original.dispose()
    fresh = build_engine(url)
    try:
        initialize_database(fresh)
        with Session(fresh) as session:
            assert session.get(Farm,farm["id"]).budget == 200000
            assert session.scalar(select(WeatherReading).where(WeatherReading.farm_id==farm["id"])) is not None
            assert len(session.scalars(select(SensorReading).where(SensorReading.farm_id==farm["id"])).all()) == 2
    finally: fresh.dispose()

def test_concurrent_initialization_seeds_once(postgres_engine):
    engine, _ = postgres_engine
    with ThreadPoolExecutor(max_workers=4) as executor: list(executor.map(lambda _: initialize_database(engine), range(4)))
    with Session(engine) as session: assert len(session.scalars(select(Farm)).all()) == 1
    assert {"farms","weather_readings","sensor_readings"} <= set(inspect(engine).get_table_names())

def test_additive_postgres_legacy_migration(postgres_engine):
    engine, _ = postgres_engine
    legacy = Table("farms", MetaData(),Column("id",String(36),primary_key=True),Column("profile",JSON,nullable=False),Column("created_at",DateTime(timezone=True),nullable=False))
    legacy.create(engine)
    with engine.begin() as connection:
        connection.execute(legacy.insert().values(id="old-farm", profile={"name":"Existing farm","area_ha":2,"farmer_name":"Existing farmer"},created_at=datetime.now(timezone.utc)))
    initialize_database(engine)
    initialize_database(engine)
    with Session(engine) as session:
        farm = session.get(Farm,"old-farm")
        assert farm.name == "Existing farm" and farm.area_acres == pytest.approx(4.9421076294)
        assert len(session.scalars(select(Farm)).all()) == 1


def test_additive_sensor_metadata_preserves_old_measurements(postgres_engine):
    engine, _ = postgres_engine
    initialize_database(engine)
    # Recreate only the sensor table inside the disposable fixture schema to
    # represent the exact pre-Step-4 shape; no application data is touched.
    with engine.begin() as connection:
        connection.execute(text("DROP TABLE sensor_readings"))
        connection.execute(text("CREATE TABLE sensor_readings (id VARCHAR(36) PRIMARY KEY, farm_id VARCHAR(36) NOT NULL REFERENCES farms(id), field_id VARCHAR(100) NOT NULL, soil_moisture FLOAT NOT NULL, temperature FLOAT NOT NULL, humidity FLOAT NOT NULL, source VARCHAR(50) NOT NULL, recorded_at TIMESTAMPTZ NOT NULL)"))
        connection.execute(text("INSERT INTO sensor_readings VALUES ('old-reading','agrios-demo-farm','field-1',42,30,65,'simulator',CURRENT_TIMESTAMP)"))
    initialize_database(engine)
    initialize_database(engine)
    with Session(engine) as session:
        old = session.get(SensorReading, "old-reading")
        assert old.soil_moisture == 42 and old.temperature == 30 and old.humidity == 65
        assert old.sensor_status == "suspicious"
        assert old.validation_issues == ["Legacy reading: quality not assessed"]


def test_postgres_quality_and_farm_isolation(pg_client, postgres_engine):
    farm = pg_client.post("/api/farms", json=profile()).json()
    body = dict(farm_id=farm["id"],field_id="field-1",soil_moisture=42,temperature=30,humidity=65,source="simulator")
    normal = pg_client.post("/api/sensors/readings", json=body).json()
    assert normal["sensor_status"] == "healthy"
    body["soil_moisture"] = 95
    spike = pg_client.post("/api/sensors/readings", json=body).json()
    assert spike["sensor_status"] == "suspicious" and spike["validation_issues"]
    body["humidity"] = 105
    assert pg_client.post("/api/sensors/readings", json=body).status_code == 422
    assert pg_client.get("/api/sensors/history",params={"farm_id":"agrios-demo-farm"}).json() == []
    engine, url = postgres_engine
    engine.dispose()
    fresh = build_engine(url)
    try:
        with Session(fresh) as session:
            persisted = session.get(SensorReading,spike["id"])
            assert persisted.sensor_status == "suspicious" and persisted.validation_issues == spike["validation_issues"]
            assert len(session.scalars(select(SensorReading)).all()) == 2
    finally:
        fresh.dispose()
