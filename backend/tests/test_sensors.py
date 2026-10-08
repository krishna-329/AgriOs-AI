import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from app.db.database import Base, get_session
from app.main import app
from app.db.models import Farm, SensorReading
from datetime import datetime, timedelta, timezone

@pytest.fixture
def session():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as s:
        yield s
    engine.dispose()

@pytest.fixture
def client(session):
    def session_override():
        yield session
    app.dependency_overrides[get_session] = session_override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def demo_farm(session):
    farm = Farm(
        name="Demo Farm",
        farmer_name="Demo Farmer",
        latitude=10.0,
        longitude=20.0,
        area=10.0
    )
    session.add(farm)
    session.commit()
    session.refresh(farm)
    return farm

def test_sensor_ingestion_valid(client: TestClient, session: Session, demo_farm):
    response = client.post("/api/sensors/readings", json={
        "farm_id": demo_farm.id,
        "field_id": "field-1",
        "soil_moisture": 42.5,
        "temperature": 31.8,
        "humidity": 66.2,
        "source": "simulator"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["soil_moisture"] == 42.5
    
    reading = session.scalar(select(SensorReading).where(SensorReading.id == data["id"]))
    assert reading is not None

def test_sensor_ingestion_invalid(client: TestClient, demo_farm):
    response = client.post("/api/sensors/readings", json={
        "farm_id": demo_farm.id,
        "field_id": "field-1",
        "soil_moisture": 105.0,  # Invalid
        "temperature": 31.8,
        "humidity": 66.2,
        "source": "simulator"
    })
    assert response.status_code == 422

def test_sensor_history(client: TestClient, demo_farm):
    client.post("/api/sensors/readings", json={
        "farm_id": demo_farm.id,
        "field_id": "field-1",
        "soil_moisture": 40.0,
        "temperature": 30.0,
        "humidity": 60.0,
        "source": "simulator"
    })
    client.post("/api/sensors/readings", json={
        "farm_id": demo_farm.id,
        "field_id": "field-1",
        "soil_moisture": 41.0,
        "temperature": 31.0,
        "humidity": 61.0,
        "source": "simulator"
    })
    
    response = client.get(f"/api/sensors/latest?farm_id={demo_farm.id}&field_id=field-1")
    assert response.status_code == 200
    assert response.json()["soil_moisture"] == 41.0
    
    response = client.get(f"/api/sensors/history?farm_id={demo_farm.id}&field_id=field-1&limit=10")
    assert response.status_code == 200
    assert len(response.json()) >= 2
    
def test_farm_filtering(client: TestClient):
    response = client.get("/api/sensors/latest?farm_id=invalid-id&field_id=field-1")
    assert response.status_code == 404


def payload(farm_id, **values):
    return dict(farm_id=farm_id, field_id="field-1", soil_moisture=42, temperature=30, humidity=65, source="simulator", **values)


@pytest.mark.parametrize("metric,value", [("soil_moisture", -1), ("soil_moisture",101), ("humidity",-1), ("humidity",101), ("temperature",99.9), ("temperature",-30)])
def test_bounds_do_not_persist(client, session, demo_farm, metric, value):
    data = payload(demo_farm.id)
    data[metric] = value
    assert client.post("/api/sensors/readings", json=data).status_code == 422
    assert session.scalars(select(SensorReading)).all() == []


def test_empty_and_isolated_farm_and_field(client, session, demo_farm):
    other = Farm(name="Second farm")
    session.add(other)
    session.commit()
    assert client.get("/api/sensors/history", params={"farm_id":demo_farm.id}).json() == []
    assert client.get("/api/sensors/latest", params={"farm_id":demo_farm.id}).status_code == 404
    first = client.post("/api/sensors/readings", json=payload(demo_farm.id)).json()
    assert first["sensor_status"] == "healthy" and first["timestamp"] == first["recorded_at"]
    assert first["validation_issues"] == []
    assert client.get("/api/sensors/history", params={"farm_id":other.id}).json() == []
    assert client.get("/api/sensors/history", params={"farm_id":demo_farm.id,"field_id":"field-2"}).json() == []
    assert client.get("/api/sensors/history", params={"farm_id":demo_farm.id}).json() == [first]


def test_spike_flagged_and_recovery_healthy(client, demo_farm):
    data = payload(demo_farm.id)
    client.post("/api/sensors/readings", json=data)
    data["soil_moisture"] = 95
    spike = client.post("/api/sensors/readings", json=data).json()
    assert spike["sensor_status"] == "suspicious"
    assert any("jump" in issue for issue in spike["validation_issues"])
    data["soil_moisture"] = 41.6
    recovered = client.post("/api/sensors/readings", json=data).json()
    assert recovered["sensor_status"] == "healthy"


def test_frozen_stream_and_timestamps(client, demo_farm):
    start = datetime.now(timezone.utc) - timedelta(seconds=120)
    for step in range(7):
        data = payload(demo_farm.id, timestamp=(start+timedelta(seconds=10*step)).isoformat())
        response = client.post("/api/sensors/readings", json=data)
        assert response.status_code == 201
    assert response.json()["sensor_status"] == "suspicious"
    assert any("Frozen" in issue for issue in response.json()["validation_issues"])
    readings = client.get("/api/sensors/history", params={"farm_id":demo_farm.id,"limit":3}).json()
    assert len(readings) == 3 and readings[-1]["id"] == response.json()["id"]
    assert readings[0]["recorded_at"] < readings[-1]["recorded_at"]


def test_out_of_order_and_invalid_capture_time(client, demo_farm):
    data = payload(demo_farm.id)
    client.post("/api/sensors/readings", json=data)
    data["timestamp"] = (datetime.now(timezone.utc)-timedelta(minutes=1)).isoformat()
    assert client.post("/api/sensors/readings", json=data).json()["sensor_status"] == "suspicious"
    for stamp in ["2026-01-01T00:00:00", (datetime.now(timezone.utc)+timedelta(minutes=5)).isoformat()]:
        data["timestamp"] = stamp
        assert client.post("/api/sensors/readings", json=data).status_code == 422


def test_future_hardware_uses_same_contract(client, demo_farm):
    data = payload(demo_farm.id)
    data["source"] = "esp32-prototype"
    result = client.post("/api/sensors/readings", json=data)
    assert result.status_code == 201 and result.json()["source"] == "esp32-prototype"
    assert result.json()["sensor_status"] == "healthy"
