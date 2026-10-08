from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from app.db.database import get_session
from app.db.models import SensorReading, Farm
from app.schemas.sensor import (
    DemoResetRequest,
    DemoResetResponse,
    SensorReadingCreate,
    SensorReadingResponse,
    SimulationTickCreate,
)
from app.services.sensor_simulator import generate_simulation_tick
from app.services.sensor_validation import assess_reading

router = APIRouter(prefix="/api/sensors", tags=["sensors"])

def _lock_farm(session: Session, farm_id: str) -> Farm:
    farm = session.get(Farm, farm_id)
    if not farm:
        raise HTTPException(404, "Farm not found")
    session.execute(select(Farm.id).where(Farm.id == farm_id).with_for_update())
    return farm


def _source_history(session: Session, payload: SensorReadingCreate):
    return session.scalars(select(SensorReading).where(
        SensorReading.farm_id == payload.farm_id,
        SensorReading.field_id == payload.field_id,
        SensorReading.source == payload.source,
    ).order_by(SensorReading.recorded_at.desc(), SensorReading.id.desc()).limit(100)).all()


def _persist_reading(payload: SensorReadingCreate, session: Session, *, farm_locked=False, history=None):
    if not farm_locked:
        _lock_farm(session, payload.farm_id)
    timestamp = payload.timestamp or datetime.now(timezone.utc)
    history = _source_history(session, payload) if history is None else history
    sensor_status, issues = assess_reading(payload, timestamp, history)
    reading = SensorReading(
        farm_id=payload.farm_id,
        field_id=payload.field_id,
        soil_moisture=payload.soil_moisture,
        temperature=payload.temperature,
        humidity=payload.humidity,
        source=payload.source,
        recorded_at=timestamp,
        sensor_status=sensor_status,
        validation_issues=issues,
    )
    session.add(reading)
    session.commit()
    session.refresh(reading)
    return reading


@router.post("/readings", response_model=SensorReadingResponse, status_code=201)
def create_reading(payload: SensorReadingCreate, session: Session = Depends(get_session)):
    return _persist_reading(payload, session)


@router.post("/simulate-tick", response_model=SensorReadingResponse, status_code=201)
def simulate_tick(payload: SimulationTickCreate, session: Session = Depends(get_session)):
    """Generate exactly one demo reading; no background task or loop is started."""
    _lock_farm(session, payload.farm_id)
    history_payload = SensorReadingCreate(
        farm_id=payload.farm_id,
        field_id=payload.field_id,
        soil_moisture=0,
        temperature=0,
        humidity=0,
        source="simulator",
    )
    history = _source_history(session, history_payload)
    now = datetime.now(timezone.utc)
    values = generate_simulation_tick(
        farm_id=payload.farm_id,
        field_id=payload.field_id,
        scenario=payload.scenario,
        history=history,
        now=now,
    )
    reading = SensorReadingCreate(
        farm_id=payload.farm_id,
        field_id=payload.field_id,
        source="simulator",
        timestamp=now,
        **values,
    )
    return _persist_reading(reading, session, farm_locked=True, history=history)


@router.post("/reset-demo", response_model=DemoResetResponse)
def reset_demo_readings(payload: DemoResetRequest, session: Session = Depends(get_session)):
    """Delete only simulator readings for one explicit farm and field."""
    _lock_farm(session, payload.farm_id)
    result = session.execute(delete(SensorReading).where(
        SensorReading.farm_id == payload.farm_id,
        SensorReading.field_id == payload.field_id,
        SensorReading.source == "simulator",
    ))
    session.commit()
    return DemoResetResponse(deleted_count=result.rowcount or 0)

@router.get("/latest", response_model=SensorReadingResponse)
def get_latest_reading(
    farm_id: str = Query(...), 
    field_id: str = Query("field-1", min_length=1, max_length=100),
    session: Session = Depends(get_session)
):
    stmt = select(SensorReading).where(
        SensorReading.farm_id == farm_id,
        SensorReading.field_id == field_id
    ).order_by(SensorReading.recorded_at.desc(), SensorReading.id.desc()).limit(1)
    
    reading = session.scalar(stmt)
    if not reading:
        raise HTTPException(404, "No readings found")
    return reading

@router.get("/history", response_model=List[SensorReadingResponse])
def get_sensor_history(
    farm_id: str = Query(...), 
    field_id: str = Query("field-1", min_length=1, max_length=100),
    limit: int = Query(100, ge=1, le=1000),
    session: Session = Depends(get_session)
):
    stmt = select(SensorReading).where(
        SensorReading.farm_id == farm_id,
        SensorReading.field_id == field_id
    ).order_by(SensorReading.recorded_at.desc(), SensorReading.id.desc()).limit(limit)
    
    readings = session.scalars(stmt).all()
    return list(reversed(readings))
