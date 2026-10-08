const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const origin = process.env.AGRIOS_FRONTEND_URL || "http://127.0.0.1:3006";
const viewports = [1440, 1024, 768, 430, 390];
const now = new Date().toISOString();
const baseFarm = {
  farmer_name: "Demo farmer",
  district: "Demo district",
  state: "Tamil Nadu",
  latitude: 10,
  longitude: 78,
  area_acres: 10,
  soil_type: "Loamy",
  soil_ph: 6.6,
  nitrogen: 42,
  phosphorus: 21,
  potassium: 34,
  irrigation_type: "Drip",
  water_availability: 5000,
  current_crop: "Paddy",
  crop_variety: null,
  sowing_date: null,
  budget: 100000,
  created_at: now,
  updated_at: now,
};
const farms = [
  {
    ...baseFarm,
    id: "farm-a",
    name: "Low Moisture Farm",
    location_name: "Dry field",
  },
  {
    ...baseFarm,
    id: "farm-b",
    name: "Rain Farm",
    location_name: "Rain field",
    soil_ph: null,
    nitrogen: null,
    phosphorus: null,
    potassium: null,
  },
  {
    ...baseFarm,
    id: "farm-c",
    name: "Sensor Issue Farm",
    location_name: "Sensor field",
  },
  {
    ...baseFarm,
    id: "farm-d",
    name: "Empty Farm",
    location_name: "Empty field",
  },
];

function reading(farmId, moisture, quality = "healthy", seconds = 0) {
  const timestamp = new Date(Date.now() + seconds * 1000).toISOString();
  return {
    id: `${farmId}-${moisture}-${seconds}`,
    farm_id: farmId,
    field_id: "field-1",
    soil_moisture: moisture,
    temperature: 31,
    humidity: 62,
    source: "simulator",
    recorded_at: timestamp,
    timestamp,
    sensor_status: quality,
    validation_issues:
      quality === "suspicious"
        ? ["Sudden soil_moisture jump; verify sensor"]
        : [],
  };
}

const histories = {
  "farm-a": [38, 34, 29, 25].map((value, index) =>
    reading("farm-a", value, "healthy", index),
  ),
  "farm-b": [42, 41, 40].map((value, index) =>
    reading("farm-b", value, "healthy", index),
  ),
  "farm-c": [reading("farm-c", 95, "suspicious")],
  "farm-d": [],
};

function weather(farmId) {
  const rain = farmId === "farm-b" ? 70 : 20;
  return {
    latitude: 10,
    longitude: 78,
    temperature: 31,
    humidity: 62,
    rain_probability: rain,
    rain_probability_period: "today",
    wind_speed: 8,
    condition: rain >= 50 ? "Rain likely" : "Partly cloudy",
    source: "weather_api",
    provider: "test weather",
    timestamp: now,
    timezone: "Asia/Kolkata",
    temperature_unit: "°C",
    wind_speed_unit: "km/h",
    forecast: [0, 1, 2, 3, 4].map((day) => ({
      date: new Date(Date.now() + day * 86400000).toISOString().slice(0, 10),
      temperature_max: 33,
      temperature_min: 25,
      rain_probability: rain,
      condition: rain >= 50 ? "Rain likely" : "Partly cloudy",
    })),
  };
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    for (const width of viewports) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() =>
        localStorage.setItem("agrios.selectedFarmId", "farm-a"),
      );
      await page.route("**/api/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const headers = {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "Content-Type",
          "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
        };
        if (request.method() === "OPTIONS")
          return route.fulfill({ status: 204, headers, body: "" });
        if (url.pathname === "/api/sensors/history") {
          const farmId = url.searchParams.get("farm_id");
          return route.fulfill({
            status: 200,
            headers,
            contentType: "application/json",
            body: JSON.stringify(histories[farmId] || []),
          });
        }
        if (url.pathname === "/api/weather") {
          const farmId = url.searchParams.get("farm_id");
          if (farmId === "farm-d")
            return route.fulfill({ status: 503, headers, body: "{}" });
          return route.fulfill({
            status: 200,
            headers,
            contentType: "application/json",
            body: JSON.stringify(weather(farmId)),
          });
        }
        if (url.pathname === "/api/farms")
          return route.fulfill({
            status: 200,
            headers,
            contentType: "application/json",
            body: JSON.stringify(farms),
          });
        const farm =
          farms.find((item) => url.pathname.endsWith(item.id)) || farms[0];
        return route.fulfill({
          status: 200,
          headers,
          contentType: "application/json",
          body: JSON.stringify(farm),
        });
      });

      await page.goto(`${origin}/field-monitor`, { waitUntil: "networkidle" });
      const farmSelector = page.locator('select[aria-label="Selected farm"]');
      await farmSelector.selectOption("farm-a");
      await page
        .getByRole("button", { name: "Soil Conditions", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Soil Conditions", exact: true })
        .waitFor();
      await page.getByText("6.6", { exact: true }).waitFor();
      await page.getByText("42 kg/ha", { exact: true }).waitFor();
      await page.locator(".soil-moisture-chart .recharts-surface").waitFor();
      await page
        .getByRole("button", { name: "Irrigation", exact: true })
        .click();
      await page.getByText("IRRIGATION RECOMMENDED", { exact: true }).waitFor();

      if (width === 1440) {
        await farmSelector.selectOption("farm-b");
        await page
          .getByRole("button", { name: "Soil Conditions", exact: true })
          .click();
        await page.getByText("Soil test required", { exact: true }).waitFor();
        await page
          .getByText("Soil test data not available", { exact: true })
          .first()
          .waitFor();
        assert.equal(
          await page.getByText("6.6", { exact: true }).count(),
          0,
          "previous farm soil data leaked",
        );
        await page
          .getByRole("button", { name: "Irrigation", exact: true })
          .click();
        await page.getByText("NO IRRIGATION NEEDED", { exact: true }).waitFor();

        await farmSelector.selectOption("farm-c");
        await page.getByText("SENSOR ISSUE", { exact: true }).waitFor();
        assert.equal(
          await page
            .getByText("IRRIGATION RECOMMENDED", { exact: true })
            .count(),
          0,
        );

        await farmSelector.selectOption("farm-d");
        await page.getByText("INSUFFICIENT DATA", { exact: true }).waitFor();
        await page
          .getByText("Weather data temporarily unavailable", { exact: true })
          .first()
          .waitFor();
        await page
          .getByRole("button", { name: "Soil Conditions", exact: true })
          .click();
        await page
          .getByText("No simulated sensor readings available yet", {
            exact: true,
          })
          .first()
          .waitFor();
      }

      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
        `horizontal overflow at ${width}px`,
      );
      assert.deepEqual(errors, []);
      if (width === 1440 || width === 390)
        await page.screenshot({
          path: `../.runtime/field-monitor-tabs-${width}.png`,
          fullPage: true,
        });
      console.log(`PASS field-monitor soil/irrigation ${width}px`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
