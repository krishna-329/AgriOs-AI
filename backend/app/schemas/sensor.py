from datetime import datetime
from pydantic import BaseModel, Field

class SensorReadingBase(BaseModel):
    farm_id: str
    field_id: str
    soil_moisture: float = Field(..., ge=0, le=100)
    temperature: float = Field(..., ge=-20, le=60)
    humidity: float = Field(..., ge=0, le=100)
    source: str

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReadingResponse(SensorReadingBase):
    id: str
    recorded_at: datetime
    
    class Config:
        from_attributes = True
