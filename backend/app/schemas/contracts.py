from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

DataSource = Literal["farmer_input", "external_api", "public_dataset", "simulated_iot", "historical_replay", "physical_sensor"]


class FarmCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid", allow_inf_nan=False)
    farmer_name: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=100)
    location: str = Field(min_length=1, max_length=200)
    area_ha: float = Field(gt=0, le=100000)
    budget_inr: float = Field(ge=0)
    water_m3: float = Field(ge=0)
    fertilizer_kg: float = Field(ge=0)
    season: Literal["kharif", "rabi", "zaid"]
    current_crop: str | None = Field(default=None, max_length=100)


class FarmRead(FarmCreate):
    id: str
    created_at: datetime
    data_source: Literal["farmer_input"] = "farmer_input"


class PredictionEnvelope(BaseModel):
    model_name: str
    model_version: str
    input_features: dict[str, float | str | None]
    prediction: dict
    confidence: float | None = Field(default=None, ge=0, le=1)
    evaluation_status: Literal["pending", "evaluated"] = "pending"
    data_sources: list[DataSource]
    timestamp: datetime


class RiskEvent(BaseModel):
    id: str
    farm_id: str
    module: Literal["crop", "field", "grain_storage", "resources", "sensor_quality"]
    risk_type: str
    probability: float | None = Field(default=None, ge=0, le=1)
    confidence: float | None = Field(default=None, ge=0, le=1)
    severity: Literal["low", "medium", "high"]
    urgency: Literal["monitor", "soon", "immediate"]
    economic_impact: Literal["low", "medium", "high", "unknown"]
    reason: list[str] = Field(min_length=1)
    evidence_ids: list[str]
    data_sources: list[DataSource] = Field(min_length=1)
    recommended_action: str
    due_at: datetime | None = None
    status: Literal["open", "acknowledged", "resolved"] = "open"
    timestamp: datetime
