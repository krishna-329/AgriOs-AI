"""Prototype stream through the public ingestion contract; no database access."""
import argparse
import json
import logging
import math
import os
import random
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class SensorSimulator:
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
            # Bounded smooth day-cycle proxy, with small reproducible noise.
            phase = self.step / 30
            self.moisture = 42 - 4 * math.sin(phase) + self.random.uniform(-0.08, 0.08)
            self.temperature = 29.8 + 2 * math.sin(phase) + self.random.uniform(-0.05, 0.05)
            self.humidity = 67 - 5 * math.sin(phase) + self.random.uniform(-0.1, 0.1)
        result = dict(soil_moisture=round(self.moisture, 1), temperature=round(self.temperature, 1), humidity=round(self.humidity, 1))
        if self.scenario == "SENSOR_FAILURE" and self.step >= 5 and self.step % 6 == 5:
            if self.failure == "spike":
                result["soil_moisture"] = 95.0  # In-range but implausible jump.
            elif self.failure == "impossible":
                result["temperature"] = 99.9  # Deliberately NOT clamped; API rejects.
        self.step += 1
        return result


def api_request(base, path, payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(base + path, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read())


def resolve_farm(base, farm_id=None):
    if farm_id:
        return api_request(base, "/api/farms/" + urllib.parse.quote(farm_id, safe=""))["id"]
    farms = api_request(base, "/api/farms")
    if len(farms) != 1:
        raise ValueError("Specify --farm-id when the backend has zero or multiple farms")
    return farms[0]["id"]


def main():
    parser = argparse.ArgumentParser(description="AgriOS simulated IoT stream (not physical hardware)")
    parser.add_argument("--api-url", default=os.getenv("AGRIOS_API_URL", "http://127.0.0.1:8000"))
    parser.add_argument("--farm-id", default=os.getenv("AGRIOS_FARM_ID"))
    parser.add_argument("--field", default="field-1")
    parser.add_argument("--scenario", choices=["NORMAL", "WATER_STRESS", "SENSOR_FAILURE", "SENSOR_FAULT"], default="NORMAL")
    parser.add_argument("--failure", choices=["spike", "frozen", "impossible"], default="spike")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--interval", type=float, default=5)
    parser.add_argument("--count", type=int, default=0, help="0 runs until stopped")
    args = parser.parse_args()
    parsed = urllib.parse.urlsplit(args.api_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.username or parsed.password or parsed.query or parsed.fragment:
        parser.error("Use an HTTP(S) API URL without credentials, query or fragment")
    if not math.isfinite(args.interval) or args.interval < 1 or args.count < 0 or not args.field.strip():
        parser.error("Interval must be >= 1 second; count >= 0; field must not be blank")
    base = args.api_url.rstrip("/")
    try:
        farm_id = resolve_farm(base, args.farm_id)
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError):
        parser.error("Could not verify farm. Check backend availability and --farm-id")
    stream = SensorSimulator(args.scenario, args.seed, args.failure)
    logger.info("Simulated IoT Data: farm=%s field=%s scenario=%s", farm_id, args.field, stream.scenario)
    sent = 0
    while args.count == 0 or sent < args.count:
        payload = {**stream.next_reading(), "farm_id": farm_id, "field_id": args.field,
                   "source": "simulator", "timestamp": datetime.now(timezone.utc).isoformat()}
        try:
            response = api_request(base, "/api/sensors/readings", payload)
            logger.info("Stored prototype reading: moisture=%s temperature=%s humidity=%s quality=%s",
                        payload["soil_moisture"], payload["temperature"], payload["humidity"], response["sensor_status"])
        except urllib.error.HTTPError as error:
            logger.warning("API rejected reading (HTTP %s); invalid data was not stored", error.code)
        except (urllib.error.URLError, TimeoutError, ValueError, KeyError):
            logger.warning("API unavailable; no reading stored. Next attempt follows the interval")
        sent += 1
        if args.count == 0 or sent < args.count:
            time.sleep(args.interval)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Prototype stream stopped")
