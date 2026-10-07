import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_session
from app.main import app


@pytest.fixture
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    def session_override():
        with Session(engine) as session:
            yield session
    app.dependency_overrides[get_session] = session_override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    engine.dispose()


def profile():
    return dict(farmer_name="Demo farmer", name="North field", location="Guntur", area_ha=2, budget_inr=100000, water_m3=5000, fertilizer_kg=200, season="kharif")


def test_persistence_and_source(client):
    response = client.post("/api/v1/farms", json=profile())
    assert response.status_code == 201
    saved = response.json()
    assert client.get(f"/api/v1/farms/{saved['id']}").json() == saved
    assert saved["data_source"] == "farmer_input"


def test_invalid_resource_rejected(client):
    assert client.post("/api/v1/farms", json={**profile(), "area_ha": -1}).status_code == 422
    assert client.get("/api/v1/farms/missing").status_code == 404
