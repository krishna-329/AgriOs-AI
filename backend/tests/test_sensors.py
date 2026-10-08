import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from app.db.database import Base, get_session
from app.main import app
from app.db.models import Farm, SensorReading

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
