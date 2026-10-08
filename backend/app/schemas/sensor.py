from datetime import datetime, timedelta, timezone
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

class SensorReadingBase(BaseModel):
    farm_id: str = Field(min_length=1, max_length=36)
    field_id: str = Field(min_length=1, max_length=100)
    soil_moisture: float = Field(ge=0, le=100, allow_inf_nan=False)
    temperature: float = Field(ge=-20, le=60, allow_inf_nan=False)
    humidity: float = Field(ge=0, le=100, allow_inf_nan=False)
    source: str = Field(default="simulator", min_length=1, max_length=50)

    @field_validator("farm_id", "field_id", "source")
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError("Must not be blank")
        return value.strip()

class SensorReadingCreate(SensorReadingBase):
    # Existing clients may omit capture time; the API then uses server UTC.
    timestamp: datetime | None = None

    @field_validator("timestamp")
    @classmethod
    def capture_time(cls, value):
        if value is None:
            return value
        if value.tzinfo is None:
            raise ValueError("Timestamp must include a timezone")
        value = value.astimezone(timezone.utc)
        if value > datetime.now(timezone.utc) + timedelta(seconds=30):
            raise ValueError("Timestamp must not be in the future")
        return value

class SensorReadingResponse(SensorReadingBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    recorded_at: datetime
    sensor_status: Literal["healthy", "suspicious", "invalid"]
    validation_issues: list[str]

    @field_validator("recorded_at")
    @classmethod
    def utc_time(cls, value):
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)

    @computed_field
    @property
    def timestamp(self) -> datetime:
        return self.recorded_at
