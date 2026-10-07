from datetime import date, datetime, timezone
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

class FarmWrite(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid", allow_inf_nan=False)
    name: str = Field(min_length=1, max_length=100)
    farmer_name: str | None = Field(default=None, max_length=100)
    location_name: str | None = Field(default=None, max_length=200)
    district: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    area_acres: float | None = Field(default=None, gt=0, le=1000000)
    soil_type: str | None = Field(default=None, max_length=100)
    soil_ph: float | None = Field(default=None, ge=0, le=14)
    nitrogen: float | None = Field(default=None, ge=0)
    phosphorus: float | None = Field(default=None, ge=0)
    potassium: float | None = Field(default=None, ge=0)
    irrigation_type: str | None = Field(default=None, max_length=100)
    water_availability: float | None = Field(default=None, ge=0)
    current_crop: str | None = Field(default=None, max_length=100)
    crop_variety: str | None = Field(default=None, max_length=100)
    sowing_date: date | None = None
    budget: float | None = Field(default=None, ge=0)

    @field_validator("farmer_name", "location_name", "district", "state", "soil_type", "irrigation_type", "current_crop", "crop_variety", mode="before")
    @classmethod
    def blank_to_none(cls, value):
        return None if isinstance(value, str) and not value.strip() else value

    @model_validator(mode="after")
    def coordinates_together(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Enter both latitude and longitude, or leave both blank")
        return self

class FarmRead(FarmWrite):
    model_config = ConfigDict(from_attributes=True, allow_inf_nan=False)
    id: str
    created_at: datetime
    updated_at: datetime

    @field_validator("created_at", "updated_at")
    @classmethod
    def utc_timestamp(cls, value):
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
