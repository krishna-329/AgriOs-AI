from datetime import date, datetime, timezone
from uuid import uuid4
from sqlalchemy import DateTime, JSON, String, Float, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class Farm(Base):
    __tablename__ = "farms"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    profile: Mapped[dict] = mapped_column(JSON, default=dict)
    name: Mapped[str | None] = mapped_column(String(100))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    area: Mapped[float | None] = mapped_column(Float)  # hectares
    location_name: Mapped[str | None] = mapped_column(String(200))
    farmer_name: Mapped[str | None] = mapped_column(String(100))
    district: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    area_acres: Mapped[float | None] = mapped_column(Float)
    soil_type: Mapped[str | None] = mapped_column(String(100))
    soil_ph: Mapped[float | None] = mapped_column(Float)
    nitrogen: Mapped[float | None] = mapped_column(Float)  # kg/ha
    phosphorus: Mapped[float | None] = mapped_column(Float)  # kg/ha
    potassium: Mapped[float | None] = mapped_column(Float)  # kg/ha
    irrigation_type: Mapped[str | None] = mapped_column(String(100))
    water_availability: Mapped[float | None] = mapped_column(Float)  # cubic metres
    current_crop: Mapped[str | None] = mapped_column(String(100))
    crop_variety: Mapped[str | None] = mapped_column(String(100))
    sowing_date: Mapped[date | None] = mapped_column(Date)
    budget: Mapped[float | None] = mapped_column(Float)  # INR
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class WeatherReading(Base):
    __tablename__ = "weather_readings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    farm_id: Mapped[str | None] = mapped_column(ForeignKey("farms.id"), index=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    temperature: Mapped[float] = mapped_column(Float)
    humidity: Mapped[float] = mapped_column(Float)
    rain_probability: Mapped[float | None] = mapped_column(Float)
    wind_speed: Mapped[float] = mapped_column(Float)
    condition: Mapped[str] = mapped_column(String(100))
    source: Mapped[str] = mapped_column(String(50))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
