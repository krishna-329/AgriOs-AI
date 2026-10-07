import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.db.database import get_session
from app.db.models import Farm, WeatherReading
from app.db.bootstrap import DEMO_FARM_ID
from app.schemas.weather import WeatherResponse, DemoFarm
from app.services.weather_service import WeatherService, WeatherUnavailable, get_weather_service

router = APIRouter(prefix="/api", tags=["weather"])
logger = logging.getLogger(__name__)

@router.get("/farms/demo", response_model=DemoFarm)
def demo_farm(session: Session = Depends(get_session)):
    farm = session.get(Farm, DEMO_FARM_ID)
    if farm is None:
        raise HTTPException(503, "Demo farm unavailable")
    return farm

@router.get("/weather", response_model=WeatherResponse)
async def weather(latitude: float = Query(ge=-90, le=90, allow_inf_nan=False), longitude: float = Query(ge=-180, le=180, allow_inf_nan=False), farm_id: str | None = Query(default=None), session: Session = Depends(get_session), service: WeatherService = Depends(get_weather_service)):
    selected_farm = session.get(Farm, farm_id) if farm_id else None
    if farm_id and selected_farm is None:
        raise HTTPException(404, "Farm not found")
    if selected_farm and (selected_farm.latitude != latitude or selected_farm.longitude != longitude):
        raise HTTPException(409, "Farm coordinates changed. Refresh the farm profile.")
    try:
        result = await service.get_weather(latitude, longitude)
    except WeatherUnavailable as exc:
        raise HTTPException(exc.status_code, "Weather temporarily unavailable") from exc
    try:
        farm = selected_farm or session.scalar(select(Farm).where(Farm.latitude == latitude, Farm.longitude == longitude))
        session.add(WeatherReading(farm_id=farm.id if farm else None, latitude=latitude, longitude=longitude, temperature=result.temperature, humidity=result.humidity, rain_probability=result.rain_probability, wind_speed=result.wind_speed, condition=result.condition, source=result.source, recorded_at=result.timestamp))
        session.commit()
    except SQLAlchemyError as exc:
        session.rollback()
        logger.error("Weather reading persistence failed: %s", type(exc).__name__)
        raise HTTPException(503, "Weather temporarily unavailable") from exc
    return result
