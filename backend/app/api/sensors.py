from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_session
from app.db.models import SensorReading, Farm
from app.schemas.sensor import SensorReadingCreate, SensorReadingResponse
from app.services.sensor_validation import assess_reading

router = APIRouter(prefix="/api/sensors", tags=["sensors"])

@router.post("/readings", response_model=SensorReadingResponse, status_code=201)
def create_reading(payload: SensorReadingCreate, session: Session = Depends(get_session)):
    farm = session.get(Farm, payload.farm_id)
    if not farm:
        raise HTTPException(404, "Farm not found")
        
    # PostgreSQL serializes quality checks on the existing farm transaction.
    session.execute(select(Farm.id).where(Farm.id == payload.farm_id).with_for_update())
    timestamp = payload.timestamp or datetime.now(timezone.utc)
    history = session.scalars(select(SensorReading).where(
        SensorReading.farm_id == payload.farm_id,
        SensorReading.field_id == payload.field_id,
        SensorReading.source == payload.source,
    ).order_by(SensorReading.recorded_at.desc(), SensorReading.id.desc()).limit(100)).all()
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
