"""Atomic, idempotent initialization; PostgreSQL startup is serialized across instances."""
from datetime import datetime, timezone
from sqlalchemy import inspect, text, select
from sqlalchemy.orm import Session
from app.config import settings
from app.db.database import Base
from app.db.models import Farm

DEMO_FARM_ID = "agrios-demo-farm"
ACRES_PER_HECTARE = 2.4710538147

def initialize_database(engine):
    columns = {
        "name": "VARCHAR(100)", "latitude": "FLOAT", "longitude": "FLOAT", "area": "FLOAT", "location_name": "VARCHAR(200)",
        "farmer_name": "VARCHAR(100)", "district": "VARCHAR(100)", "state": "VARCHAR(100)", "area_acres": "FLOAT",
        "soil_type": "VARCHAR(100)", "soil_ph": "FLOAT", "nitrogen": "FLOAT", "phosphorus": "FLOAT", "potassium": "FLOAT",
        "irrigation_type": "VARCHAR(100)", "water_availability": "FLOAT", "current_crop": "VARCHAR(100)", "crop_variety": "VARCHAR(100)",
        "sowing_date": "DATE", "budget": "FLOAT", "updated_at": "TIMESTAMP",
    }
    with engine.begin() as connection:
        if connection.dialect.name == "postgresql":
            connection.execute(text("SELECT set_config('lock_timeout', :timeout, true)"), {"timeout": f"{settings.database_init_lock_timeout}s"})
            # A transaction-scoped lock also protects create_all and empty-only
            # seeding. Released automatically on commit or startup failure.
            connection.execute(text("SELECT pg_advisory_xact_lock(731924680125)"))
        Base.metadata.create_all(connection)
        existing = {column["name"] for column in inspect(connection).get_columns("farms")}
        added = set(columns) - existing
        for name in sorted(added):
            connection.execute(text(f"ALTER TABLE farms ADD COLUMN {name} {columns[name]}"))
        with Session(bind=connection) as session:
            farms = list(session.scalars(select(Farm)))
            for farm in farms:
                profile = farm.profile or {}
                legacy = {"name": profile.get("name"), "area": profile.get("area_ha"), "location_name": profile.get("location"),
                          "farmer_name": profile.get("farmer_name"), "budget": profile.get("budget_inr"),
                          "water_availability": profile.get("water_m3"), "current_crop": profile.get("current_crop")}
                for key, value in legacy.items():
                    if key in added:
                        setattr(farm, key, value)
                if "area_acres" in added and farm.area is not None:
                    farm.area_acres = farm.area * ACRES_PER_HECTARE
                if "updated_at" in added:
                    farm.updated_at = farm.created_at or datetime.now(timezone.utc)
            if not farms:
                profile = dict(farmer_name="R. Karthikeyan", name="Green Valley Farm", location="Ramanathapuram, Tamil Nadu", area_ha=10 / ACRES_PER_HECTARE, budget_inr=100000, water_m3=5000, fertilizer_kg=0, season="kharif", current_crop="Paddy")
                session.add(Farm(id=DEMO_FARM_ID, profile=profile, name=profile["name"], farmer_name=profile["farmer_name"], latitude=9.3716, longitude=78.8308,
                                 area=profile["area_ha"], area_acres=10, location_name=profile["location"], district="Ramanathapuram", state="Tamil Nadu",
                                 current_crop="Paddy", irrigation_type="Borewell", water_availability=5000, budget=100000))
            session.flush()
