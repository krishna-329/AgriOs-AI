from fastapi import HTTPException
from pydantic import ValidationError
from app.db.repositories import FarmRepository
from app.schemas.contracts import FarmCreate, FarmRead


class FarmService:
    def __init__(self, repository: FarmRepository):
        self.repository = repository

    @staticmethod
    def serialize(farm):
        try:
            return FarmRead(**farm.profile, id=farm.id, created_at=farm.created_at)
        except ValidationError as exc:
            raise HTTPException(409, "This profile uses the new farm schema. Use /api/farms instead.") from exc

    def create(self, profile: FarmCreate) -> FarmRead:
        return self.serialize(self.repository.create(profile))

    def get(self, farm_id: str) -> FarmRead | None:
        farm = self.repository.get(farm_id)
        return self.serialize(farm) if farm else None
