from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_session
from app.db.models import Farm
from app.db.bootstrap import ACRES_PER_HECTARE
from app.schemas.farm import FarmWrite, FarmRead

router = APIRouter(prefix="/api/farms", tags=["farms"])

def apply_profile(farm: Farm, payload: FarmWrite):
    for key, value in payload.model_dump().items():
        setattr(farm, key, value)
    farm.area = payload.area_acres / ACRES_PER_HECTARE if payload.area_acres is not None else None
    # Keep shared fields consistent for clients using the original v1 API.
    if farm.profile:
        farm.profile = {**farm.profile, "name": farm.name, "farmer_name": farm.farmer_name,
                        "location": farm.location_name, "area_ha": farm.area,
                        "budget_inr": farm.budget, "water_m3": farm.water_availability, "current_crop": farm.current_crop}
    farm.updated_at = datetime.now(timezone.utc)

@router.get("", response_model=list[FarmRead])
def list_farms(session: Session = Depends(get_session)):
    return session.scalars(select(Farm).order_by(Farm.created_at, Farm.id)).all()

@router.get("/{farm_id}", response_model=FarmRead)
def get_farm(farm_id: str, session: Session = Depends(get_session)):
    farm = session.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(404, "Farm not found")
    return farm

@router.post("", response_model=FarmRead, status_code=201)
def create_farm(payload: FarmWrite, session: Session = Depends(get_session)):
    farm = Farm()
    apply_profile(farm, payload)
    session.add(farm)
    session.commit()
    session.refresh(farm)
    return farm

@router.put("/{farm_id}", response_model=FarmRead)
def update_farm(farm_id: str, payload: FarmWrite, session: Session = Depends(get_session)):
    farm = get_farm(farm_id, session)
    apply_profile(farm, payload)
    session.commit()
    session.refresh(farm)
    return farm
