from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_session
from app.db.models import SensorReading, Farm
from app.schemas.sensor import SensorReadingCreate, SensorReadingResponse

router = APIRouter(prefix="/api/sensors", tags=["sensors"])

@router.post("/readings", response_model=SensorReadingResponse, status_code=201)
def create_reading(payload: SensorReadingCreate, session: Session = Depends(get_session)):
    farm = session.get(Farm, payload.farm_id)
    if not farm:
        raise HTTPException(404, "Farm not found")
        
    reading = SensorReading(
        farm_id=payload.farm_id,
        field_id=payload.field_id,
        soil_moisture=payload.soil_moisture,
        temperature=payload.temperature,
        humidity=payload.humidity,
        source=payload.source
    )
    session.add(reading)
    session.commit()
    session.refresh(reading)
    return reading

@router.get("/latest", response_model=SensorReadingResponse)
def get_latest_reading(
    farm_id: str = Query(...), 
    field_id: str = Query(...), 
    session: Session = Depends(get_session)
):
    stmt = select(SensorReading).where(
        SensorReading.farm_id == farm_id,
        SensorReading.field_id == field_id
    ).order_by(SensorReading.recorded_at.desc()).limit(1)
    
    reading = session.scalar(stmt)
    if not reading:
        raise HTTPException(404, "No readings found")
    return reading

@router.get("/history", response_model=List[SensorReadingResponse])
def get_sensor_history(
    farm_id: str = Query(...), 
    field_id: str = Query(...), 
    limit: int = Query(100, ge=1, le=1000),
    session: Session = Depends(get_session)
):
    stmt = select(SensorReading).where(
        SensorReading.farm_id == farm_id,
        SensorReading.field_id == field_id
    ).order_by(SensorReading.recorded_at.desc()).limit(limit)
    
    readings = session.scalars(stmt).all()
    return list(reversed(readings))
