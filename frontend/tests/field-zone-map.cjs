const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const origin = process.env.AGRIOS_FRONTEND_URL || "http://127.0.0.1:3006";
const viewports = (process.env.FIELD_ZONE_VIEWPORTS || "1440,1024,768,430,390")
  .split(",")
  .map(Number);
const now = new Date().toISOString();
const farms = [
  {
    id: "farm-a",
    name: "Green Valley Farm",
    farmer_name: "R. Karthikeyan",
    location_name: "Delta village",
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
  },
  {
    id: "farm-b",
    name: "Empty Farm",
    farmer_name: "Demo farmer",
    location_name: "Second village",
    district: "Demo district",
    state: "Tamil Nadu",
    latitude: 11,
    longitude: 79,
    area_acres: 7,
    soil_type: null,
    soil_ph: null,
    nitrogen: null,
    phosphorus: null,
    potassium: null,
    irrigation_type: null,
    water_availability: null,
    current_crop: "Groundnut",
    crop_variety: null,
    sowing_date: null,
    budget: null,
    created_at: now,
    updated_at: now,
  },
];

function reading(moisture, quality = "healthy", index = 0) {
  const timestamp = new Date(Date.now() + index * 1000).toISOString();
  return {
    id: `reading-${moisture}-${quality}-${index}`,
    farm_id: "farm-a",
    field_id: "field-1",
    soil_moisture: moisture,
    temperature: 31,
    humidity: 62,
    source: "simulator",
    recorded_at: timestamp,
    timestamp,
    sensor_status: quality,
    validation_issues:
      quality === "healthy" ? [] : ["Sudden soil_moisture jump; verify sensor"],
  };
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    for (const width of viewports) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const stored = { "farm-a": [reading(42)], "farm-b": [] };
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
            body: JSON.stringify(stored[farmId] || []),
          });
        }
        if (url.pathname === "/api/sensors/simulate-tick") {
          const body = request.postDataJSON();
          const current = stored[body.farm_id].at(-1) || reading(42);
          const next =
            body.scenario === "sensor_failure"
              ? reading(95, "suspicious", stored[body.farm_id].length)
              : body.scenario === "water_stress"
                ? reading(
                    Math.max(8, current.soil_moisture - 8),
                    "healthy",
                    stored[body.farm_id].length,
                  )
                : reading(42, "healthy", stored[body.farm_id].length);
          stored[body.farm_id].push(next);
          await new Promise((resolve) => setTimeout(resolve, 180));
          return route.fulfill({
            status: 201,
            headers,
            contentType: "application/json",
            body: JSON.stringify(next),
          });
        }
        if (url.pathname === "/api/sensors/reset-demo") {
          const body = request.postDataJSON();
          const deleted_count = stored[body.farm_id].length;
          stored[body.farm_id] = [];
          return route.fulfill({
            status: 200,
            headers,
            contentType: "application/json",
            body: JSON.stringify({ deleted_count }),
          });
        }
        if (url.pathname === "/api/weather")
          return route.fulfill({ status: 503, headers, body: "{}" });
        if (url.pathname === "/api/farms")
          return route.fulfill({
            status: 200,
            headers,
            contentType: "application/json",
            body: JSON.stringify(farms),
          });
        const farm = farms.find((item) => url.pathname.endsWith(item.id));
        return route.fulfill({
          status: farm ? 200 : 404,
          headers,
          contentType: "application/json",
          body: JSON.stringify(farm || {}),
        });
      });

      await page.goto(`${origin}/field-monitor`, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Green Valley Farm" }).waitFor();
      await page
        .getByText("10 acres · Paddy · Delta village", { exact: true })
        .waitFor();
      assert.equal(
        await page.locator('[data-zone-status="Healthy"]').count(),
        6,
      );
      assert.equal(
        await page.locator(".field-zone").evaluateAll((zones) => {
          const map = zones[0]?.closest("svg")?.getBoundingClientRect();
          return Boolean(
            map &&
            zones.every((zone) => {
              const box = zone.getBoundingClientRect();
              return (
                box.top >= map.top - 1 &&
                box.left >= map.left - 1 &&
                box.bottom <= map.bottom + 1 &&
                box.right <= map.right + 1
              );
            }),
          );
        }),
        true,
        `not all zones fit inside the map at ${width}px`,
      );
      await page.getByRole("button", { name: /^Zone B,/ }).click();
      await page
        .locator(".field-zone-details h3", { hasText: "Zone B" })
        .waitFor();
      await page.getByText("39.8%", { exact: true }).waitFor();
      await page
        .getByText("Continue routine monitoring.", { exact: true })
        .waitFor();
      if (width === 1440 || width === 390)
        await page.screenshot({
          path: `../.runtime/field-zone-map-${width}.png`,
          fullPage: true,
        });

      if (width === 1440) {
        await page
          .getByRole("button", { name: "Water Stress", exact: true })
          .click();
        await page
          .getByText("Applying Water Stress scenario…", { exact: true })
          .waitFor();
        await page
          .getByRole("button", { name: "Start Simulation", exact: true })
          .click();
        await page
          .getByText("● Water Stress • Running", { exact: true })
          .waitFor();
        await page.getByText(/Next update: ~\d+s/).waitFor();
        await page.locator('[data-zone-status="Stress"]').first().waitFor();
        assert.equal(
          await page
            .getByText("Applying Water Stress scenario…", { exact: true })
            .count(),
          0,
        );
        await page.getByText("Stress", { exact: true }).first().waitFor();
        await page.waitForTimeout(5200);
        await page.locator('[data-zone-status="Critical"]').first().waitFor();
        await page
          .getByRole("button", { name: "Stop Simulation", exact: true })
          .click();

        await page
          .getByRole("button", { name: "Sensor Failure", exact: true })
          .click();
        await page
          .getByText("Applying Sensor Failure scenario…", { exact: true })
          .waitFor();
        await page
          .getByRole("button", { name: "Start Simulation", exact: true })
          .click();
        await page
          .locator('[data-zone-status="Sensor Issue"]')
          .first()
          .waitFor();
        assert.equal(
          await page.locator('[data-zone-status="Sensor Issue"]').count(),
          6,
        );
        await page.getByRole("button", { name: /^Zone A,/ }).click();
        await page
          .locator(".field-zone-details")
          .getByText("⚠ Unreliable reading", { exact: true })
          .waitFor();
        await page
          .getByText("Sudden soil-moisture jump detected. Verify the sensor.", {
            exact: true,
          })
          .waitFor();
        await page.getByText("Needs verification", { exact: true }).waitFor();
        await page.screenshot({
          path: "../.runtime/field-zone-failure-1440.png",
          fullPage: true,
        });
        await page
          .getByRole("button", { name: "Stop Simulation", exact: true })
          .click();

        await page
          .getByRole("button", { name: "Reset Demo Readings", exact: true })
          .click();
        await page
          .locator('[data-zone-status="Awaiting Data"]')
          .first()
          .waitFor();
        assert.equal(
          await page.locator('[data-zone-status="Awaiting Data"]').count(),
          6,
        );
        await page.getByRole("button", { name: /^Zone D,/ }).click();
        await page
          .getByText("No current sensor reading is available for this field.", {
            exact: true,
          })
          .first()
          .waitFor();
        assert.equal(
          await page
            .locator(".field-zone-values strong")
            .evaluateAll((values) =>
              values.every((value) => value.textContent?.trim() === "--"),
            ),
          true,
          "empty zones retained stale measurements",
        );
        assert.equal(await page.getByText("95%", { exact: true }).count(), 0);
        await page.screenshot({
          path: "../.runtime/field-zone-empty-1440.png",
          fullPage: true,
        });

        await page.getByRole("button", { name: "Normal", exact: true }).click();
        await page
          .getByText("Applying Normal scenario…", { exact: true })
          .waitFor();
        await page
          .getByRole("button", { name: "Start Simulation", exact: true })
          .click();
        await page.locator('[data-zone-status="Healthy"]').first().waitFor();
        assert.equal(
          await page.locator('[data-zone-status="Healthy"]').count(),
          6,
        );
        await page
          .getByRole("button", { name: "Stop Simulation", exact: true })
          .click();

        const selector = page.locator('select[aria-label="Selected farm"]');
        await selector.selectOption("farm-b");
        await page.getByRole("heading", { name: "Empty Farm" }).waitFor();
        assert.equal(await page.locator(".field-zone").count(), 6);
        assert.equal(
          await page.locator('[data-zone-status="Awaiting Data"]').count(),
          6,
        );
        assert.equal(await page.getByText("42%", { exact: true }).count(), 0);

        await page
          .getByRole("button", { name: "Soil Conditions", exact: true })
          .click();
        await page
          .getByRole("heading", { name: "Soil Conditions", exact: true })
          .waitFor();
        await page
          .getByRole("button", { name: "Irrigation", exact: true })
          .click();
        await page
          .getByRole("heading", { name: "Irrigation Support", exact: true })
          .waitFor();
      } else {
        const selector = page.locator('select[aria-label="Selected farm"]');
        await selector.selectOption("farm-b");
        await page
          .locator('[data-zone-status="Awaiting Data"]')
          .first()
          .waitFor();
        assert.equal(
          await page.locator('[data-zone-status="Awaiting Data"]').count(),
          6,
        );
        await page.getByRole("button", { name: /^Zone F,/ }).click();
        await page
          .locator(".field-zone-details h3", { hasText: "Zone F" })
          .waitFor();
        if (width === 390)
          await page.screenshot({
            path: "../.runtime/field-zone-empty-390.png",
            fullPage: true,
          });
      }

      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
        `horizontal overflow at ${width}px`,
      );
      assert.equal(
        await page
          .locator(".simulation-status")
          .evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
        true,
        `simulation status overflow at ${width}px`,
      );
      assert.deepEqual(errors, []);
      console.log(`PASS field-zone map ${width}px`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
