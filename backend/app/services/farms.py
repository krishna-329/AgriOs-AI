from app.db.repositories import FarmRepository
from app.schemas.contracts import FarmCreate, FarmRead


class FarmService:
    def __init__(self, repository: FarmRepository):
        self.repository = repository

    @staticmethod
    def serialize(farm):
        return FarmRead(**farm.profile, id=farm.id, created_at=farm.created_at)

    def create(self, profile: FarmCreate) -> FarmRead:
        return self.serialize(self.repository.create(profile))

    def get(self, farm_id: str) -> FarmRead | None:
        farm = self.repository.get(farm_id)
        return self.serialize(farm) if farm else None
