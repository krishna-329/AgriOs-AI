"""Shared deterministic prototype sensor generation for CLI and request-driven demos."""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import math
import random


DEFAULT_READING = {
    "soil_moisture": 42.0,
    "temperature": 29.8,
    "humidity": 67.0,
}


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _request_random(farm_id: str, field_id: str, scenario: str, latest) -> random.Random:
    continuity = latest.id if latest else "initial"
    digest = hashlib.sha256(f"{farm_id}|{field_id}|{scenario}|{continuity}".encode()).digest()
    return random.Random(int.from_bytes(digest[:8], "big"))


def generate_simulation_tick(*, farm_id: str, field_id: str, scenario: str, history, now: datetime | None = None) -> dict[str, float]:
    """Generate one bounded reading from persisted history; never stores anything."""
    now = now or datetime.now(timezone.utc)
    latest = history[0] if history else None
    trusted = next((reading for reading in history if reading.sensor_status == "healthy"), None)
    baseline = latest if latest and latest.sensor_status == "healthy" else trusted
    values = DEFAULT_READING if baseline is None else {
        "soil_moisture": baseline.soil_moisture,
        "temperature": baseline.temperature,
        "humidity": baseline.humidity,
    }
    noise = _request_random(farm_id, field_id, scenario, latest)

    if scenario == "normal":
        moisture = values["soil_moisture"] + _clamp(42 - values["soil_moisture"], -0.35, 0.35) + noise.uniform(-0.12, 0.12)
        temperature = values["temperature"] + _clamp(30 - values["temperature"], -0.2, 0.2) + noise.uniform(-0.08, 0.08)
        humidity = values["humidity"] + _clamp(65 - values["humidity"], -0.35, 0.35) + noise.uniform(-0.18, 0.18)
        return {
            "soil_moisture": round(_clamp(moisture, 35, 50), 1),
            "temperature": round(_clamp(temperature, 24, 36), 1),
            "humidity": round(_clamp(humidity, 50, 80), 1),
        }

    if scenario == "water_stress":
        return {
            "soil_moisture": round(_clamp(values["soil_moisture"] - noise.uniform(2.9, 3.3), 8, 100), 1),
            "temperature": round(_clamp(values["temperature"] + noise.uniform(0.2, 0.4), -20, 40), 1),
            "humidity": round(_clamp(values["humidity"] - noise.uniform(0.6, 1.0), 30, 100), 1),
        }

    # Establish a recent healthy baseline first so validation can identify the
    # following in-range spike. This also makes an empty demo understandable.
    if trusted is None or (now - _utc(trusted.recorded_at)).total_seconds() > 60:
        return dict(DEFAULT_READING)
    spike = 95.0 if trusted.soil_moisture < 75 else 5.0
    return {
        "soil_moisture": spike,
        "temperature": round(trusted.temperature, 1),
        "humidity": round(trusted.humidity, 1),
    }


class SensorSimulator:
    """Stateful wrapper retained for the optional command-line prototype stream."""

    def __init__(self, scenario="NORMAL", seed=42, failure="spike"):
        self.scenario = "SENSOR_FAILURE" if scenario == "SENSOR_FAULT" else scenario
        self.failure = failure
        self.random = random.Random(seed)
        self.step = 0
        self.moisture, self.temperature, self.humidity = 42.0, 29.8, 67.0

    def next_reading(self):
        if self.step and self.scenario == "WATER_STRESS":
            self.moisture = max(8, self.moisture - 3 + self.random.uniform(-0.2, 0.2))
            self.temperature = min(40, self.temperature + 0.3 + self.random.uniform(-0.05, 0.05))
            self.humidity = max(30, self.humidity - 0.8 + self.random.uniform(-0.1, 0.1))
        elif self.scenario != "SENSOR_FAILURE" or self.failure != "frozen":
            phase = self.step / 30
            self.moisture = 42 - 4 * math.sin(phase) + self.random.uniform(-0.08, 0.08)
            self.temperature = 29.8 + 2 * math.sin(phase) + self.random.uniform(-0.05, 0.05)
            self.humidity = 67 - 5 * math.sin(phase) + self.random.uniform(-0.1, 0.1)
        result = dict(soil_moisture=round(self.moisture, 1), temperature=round(self.temperature, 1), humidity=round(self.humidity, 1))
        if self.scenario == "SENSOR_FAILURE" and self.step >= 5 and self.step % 6 == 5:
            if self.failure == "spike":
                result["soil_moisture"] = 95.0
            elif self.failure == "impossible":
                result["temperature"] = 99.9
        self.step += 1
        return result
