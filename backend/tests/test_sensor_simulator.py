import importlib.util
from pathlib import Path
import pytest

spec = importlib.util.spec_from_file_location("agrios_sensor_simulator", Path(__file__).resolve().parents[2] / "simulator/sensor_simulator.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def test_normal_gradual_bounded_and_reproducible():
    a, b = module.SensorSimulator(), module.SensorSimulator()
    rows = [a.next_reading() for _ in range(1000)]
    assert rows == [b.next_reading() for _ in range(1000)]
    assert all(37 <= r["soil_moisture"] <= 47 and 27 <= r["temperature"] <= 33 and 61 <= r["humidity"] <= 73 for r in rows)
    assert all(abs(rows[i]["soil_moisture"]-rows[i-1]["soil_moisture"]) < 0.5 for i in range(1,len(rows)))


def test_water_stress_declines_without_random_spikes():
    stream = module.SensorSimulator("WATER_STRESS")
    rows = [stream.next_reading() for _ in range(12)]
    assert rows[0]["soil_moisture"] == 42
    assert all(rows[i]["soil_moisture"] <= rows[i-1]["soil_moisture"] for i in range(1,len(rows)))
    assert rows[-1]["soil_moisture"] < 20


@pytest.mark.parametrize("failure", ["spike","impossible","frozen"])
def test_failure_is_visible_not_clamped(failure):
    stream = module.SensorSimulator("SENSOR_FAILURE", failure=failure)
    rows = [stream.next_reading() for _ in range(15)]
    if failure == "spike": assert rows[5]["soil_moisture"] == 95 and rows[6]["soil_moisture"] < 45
    elif failure == "impossible": assert rows[5]["temperature"] == 99.9
    else: assert all(row == rows[0] for row in rows)


def test_multiple_farms_require_explicit_selection(monkeypatch):
    monkeypatch.setattr(module,"api_request",lambda *args: [{"id":"farm-a"},{"id":"farm-b"}])
    with pytest.raises(ValueError): module.resolve_farm("http://example.invalid")
