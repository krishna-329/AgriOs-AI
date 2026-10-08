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


def simulation_tick(client, farm_id, scenario="normal"):
    return client.post("/api/sensors/simulate-tick", json={
        "farm_id": farm_id,
        "field_id": "field-1",
        "scenario": scenario,
    })


def test_normal_tick_generation_and_repeated_persistence(client, session, demo_farm):
    first = simulation_tick(client, demo_farm.id)
    second = simulation_tick(client, demo_farm.id)
    assert first.status_code == second.status_code == 201
    assert first.json()["sensor_status"] == second.json()["sensor_status"] == "healthy"
    assert 35 <= second.json()["soil_moisture"] <= 50
    stored = session.scalars(select(SensorReading).where(
        SensorReading.farm_id == demo_farm.id,
        SensorReading.source == "simulator",
    )).all()
    assert len(stored) == 2


def test_water_stress_tick_continuity(client, demo_farm):
    start = simulation_tick(client, demo_farm.id).json()
    values = [start]
    for _ in range(7):
        response = simulation_tick(client, demo_farm.id, "water_stress")
        assert response.status_code == 201
        values.append(response.json())
    moisture = [item["soil_moisture"] for item in values]
    assert all(moisture[index] < moisture[index - 1] for index in range(1, len(moisture)))
    assert moisture[-1] < 22
    assert values[-1]["temperature"] > values[0]["temperature"]
    assert values[-1]["humidity"] < values[0]["humidity"]


def test_sensor_failure_tick_is_flagged_by_existing_validation(client, demo_farm):
    assert simulation_tick(client, demo_farm.id).json()["sensor_status"] == "healthy"
    failure = simulation_tick(client, demo_farm.id, "sensor_failure")
    assert failure.status_code == 201
    assert failure.json()["sensor_status"] == "suspicious"
    assert any("jump" in issue.lower() for issue in failure.json()["validation_issues"])
    assert 0 <= failure.json()["soil_moisture"] <= 100


def test_simulation_rejects_invalid_scenario_and_farm(client, demo_farm):
    invalid_scenario = simulation_tick(client, demo_farm.id, "monsoon_magic")
    assert invalid_scenario.status_code == 422
    missing_farm = simulation_tick(client, "missing-farm")
    assert missing_farm.status_code == 404


def test_simulation_farm_isolation(client, session, demo_farm):
    other = Farm(name="Isolated Farm")
    session.add(other)
    session.commit()
    simulation_tick(client, demo_farm.id, "normal")
    simulation_tick(client, other.id, "water_stress")
    first_history = client.get("/api/sensors/history", params={"farm_id":demo_farm.id}).json()
    other_history = client.get("/api/sensors/history", params={"farm_id":other.id}).json()
    assert len(first_history) == len(other_history) == 1
    assert {item["farm_id"] for item in first_history} == {demo_farm.id}
    assert {item["farm_id"] for item in other_history} == {other.id}


def test_reset_demo_readings_is_strictly_scoped(client, session, demo_farm):
    other = Farm(name="Other Farm")
    session.add(other)
    session.commit()
    simulation_tick(client, demo_farm.id)
    simulation_tick(client, demo_farm.id)
    simulation_tick(client, other.id)
    hardware = client.post("/api/sensors/readings", json={
        "farm_id": demo_farm.id,
        "field_id": "field-1",
        "soil_moisture": 43,
        "temperature": 30,
        "humidity": 64,
        "source": "esp32-prototype",
    })
    assert hardware.status_code == 201
    reset = client.post("/api/sensors/reset-demo", json={
        "farm_id": demo_farm.id,
        "field_id": "field-1",
    })
    assert reset.status_code == 200 and reset.json() == {"deleted_count": 2}
    remaining = session.scalars(select(SensorReading)).all()
    assert {(item.farm_id, item.source) for item in remaining} == {
        (demo_farm.id, "esp32-prototype"),
        (other.id, "simulator"),
    }
    assert session.get(Farm, demo_farm.id) is not None
