"""Conservative source-independent quality checks; these are not ML results."""
from datetime import timezone

JUMP_LIMITS = {"soil_moisture": 15, "temperature": 8, "humidity": 20}
FROZEN_SECONDS = 60


def utc(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def assess_reading(payload, timestamp, history):
    issues = []
    timestamp = utc(timestamp)
    if history:
        newest = history[0]
        gap = (timestamp - utc(newest.recorded_at)).total_seconds()
        if gap <= 0:
            issues.append("Out-of-order or duplicate capture time")
        # A flagged spike cannot become the trusted baseline for recovery.
        trusted = next((r for r in history if r.sensor_status == "healthy"), None)
        if trusted and 0 <= (timestamp - utc(trusted.recorded_at)).total_seconds() <= 60:
            for metric, limit in JUMP_LIMITS.items():
                if abs(getattr(payload, metric) - getattr(trusted, metric)) > limit:
                    issues.append(f"Sudden {metric} jump; verify sensor")
        unchanged = []
        for reading in history:
            if all(abs(getattr(payload, key) - getattr(reading, key)) < 0.01 for key in JUMP_LIMITS):
                unchanged.append(reading)
            else:
                break
        if len(unchanged) >= 5 and (timestamp - utc(unchanged[-1].recorded_at)).total_seconds() >= FROZEN_SECONDS:
            issues.append("Frozen stream: all metrics unchanged for at least 60 seconds")
    return ("suspicious" if issues else "healthy"), issues
