from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.schemas.contracts import FarmCreate


class FarmRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, data: FarmCreate) -> Farm:
        farm = Farm(profile=data.model_dump(), name=data.name, area=data.area_ha, location_name=data.location, farmer_name=data.farmer_name, area_acres=data.area_ha * 2.4710538147, budget=data.budget_inr, water_availability=data.water_m3, current_crop=data.current_crop)
        self.session.add(farm)
        self.session.commit()
        self.session.refresh(farm)
        return farm

    def get(self, farm_id: str) -> Farm | None:
        return self.session.get(Farm, farm_id)
