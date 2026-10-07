from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.database import get_session
from app.db.repositories import FarmRepository
from app.schemas.contracts import FarmCreate, FarmRead
from app.services.farms import FarmService

router = APIRouter(prefix="/api/v1")


@router.get("/health")
def health(session: Session = Depends(get_session)):
    session.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected", "stage": "foundation", "authentication": "not_configured"}


@router.post("/farms", response_model=FarmRead, status_code=201)
def create_farm(profile: FarmCreate, session: Session = Depends(get_session)):
    return FarmService(FarmRepository(session)).create(profile)


@router.get("/farms/{farm_id}", response_model=FarmRead)
def get_farm(farm_id: str, session: Session = Depends(get_session)):
    farm = FarmService(FarmRepository(session)).get(farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm
