import time
import random
import argparse
import sys
import logging
import urllib.request
import urllib.error
import json

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

API_BASE_URL = "http://127.0.0.1:8000"

def get_farm_id():
    try:
        req = urllib.request.Request(f"{API_BASE_URL}/api/farms", method="GET")
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                farms = json.loads(response.read().decode())
                if farms:
                    return farms[0]["id"]
    except urllib.error.URLError as e:
        logger.error(f"Could not connect to backend to fetch farm ID: {e}")
    return "agrios-demo-farm"

def main():
    parser = argparse.ArgumentParser(description="AgriOS Sensor Simulator")
    parser.add_argument("--scenario", choices=["NORMAL", "WATER_STRESS", "SENSOR_FAULT"], default="NORMAL", help="Simulation scenario")
    parser.add_argument("--interval", type=float, default=5.0, help="Interval between readings in seconds")
    parser.add_argument("--field", type=str, default="field-1", help="Field ID")
    args = parser.parse_args()

    farm_id = get_farm_id()
    logger.info(f"Starting simulator for farm '{farm_id}', field '{args.field}' in {args.scenario} mode.")
    
    # Initial state
    soil_moisture = 45.0
    temperature = 30.0
    humidity = 65.0
    
    fault_counter = 0

    while True:
        # Generate next state based on scenario
        if args.scenario == "NORMAL":
            soil_moisture += random.uniform(-0.5, 0.5)
            temperature += random.uniform(-0.3, 0.3)
            humidity += random.uniform(-1.0, 1.0)
        
        elif args.scenario == "WATER_STRESS":
            soil_moisture -= random.uniform(0.1, 0.8)
            temperature += random.uniform(0.0, 0.5)
            humidity -= random.uniform(0.0, 1.0)
            
        elif args.scenario == "SENSOR_FAULT":
            fault_counter += 1
            if fault_counter % 5 == 0:
                # Spike
                soil_moisture = 0.0
                temperature = 99.9
                humidity = 0.0
            else:
                # Normal drift
                soil_moisture += random.uniform(-0.5, 0.5)
                temperature += random.uniform(-0.3, 0.3)
                humidity += random.uniform(-1.0, 1.0)

        # Clamp values to logical limits
        soil_moisture = max(0.0, min(100.0, soil_moisture))
        temperature = max(-20.0, min(60.0, temperature))
        humidity = max(0.0, min(100.0, humidity))

        payload = {
            "farm_id": farm_id,
            "field_id": args.field,
            "soil_moisture": round(soil_moisture, 1),
            "temperature": round(temperature, 1),
            "humidity": round(humidity, 1),
            "source": "simulator"
        }

        try:
            data_bytes = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                f"{API_BASE_URL}/api/sensors/readings", 
                data=data_bytes, 
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=2) as response:
                if response.status == 201:
                    logger.info(f"Sent reading: SM={payload['soil_moisture']}% T={payload['temperature']}C H={payload['humidity']}%")
                else:
                    logger.warning(f"Backend rejected reading. Status: {response.status}")
        except urllib.error.URLError as e:
            logger.error(f"Failed to send reading to backend: {e}")

        time.sleep(args.interval)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Simulator stopped.")
        sys.exit(0)
