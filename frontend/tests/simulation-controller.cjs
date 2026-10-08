const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const origin = process.env.AGRIOS_FRONTEND_URL || "http://127.0.0.1:3006";
const viewports = (process.env.SIMULATION_VIEWPORTS || "1440,1024,768,430,390")
  .split(",")
  .map(Number);
const farms = ["farm-a", "farm-b"].map((id, index) => ({
  id,
  name: `Farm ${index ? "B" : "A"}`,
  farmer_name: "Demo farmer",
  location_name: `Demo location ${index + 1}`,
  latitude: 10 + index,
  longitude: 78,
  area_acres: 10,
  current_crop: "Paddy",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

function reading(farmId, moisture, quality = "healthy") {
  const timestamp = new Date().toISOString();
  return {
    id: `${farmId}-${timestamp}-${moisture}`,
    farm_id: farmId,
    field_id: "field-1",
    soil_moisture: moisture,
    temperature: 30,
    humidity: 65,
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

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    for (const width of viewports) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const stored = { "farm-a": [], "farm-b": [] };
      const ticks = { "farm-a": 0, "farm-b": 0 };
      let failTick = false;

      if (width === 1024) stored["farm-a"].push(reading("farm-a", 42));

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
        if (url.pathname === "/api/sensors/simulate-tick") {
          if (failTick)
            return route.fulfill({ status: 503, headers, body: "{}" });
          const body = request.postDataJSON();
          const farmId = body.farm_id;
          ticks[farmId] += 1;
          const previous = stored[farmId].at(-1);
          const next =
            body.scenario === "sensor_failure"
              ? reading(farmId, 95, "suspicious")
              : body.scenario === "water_stress"
                ? reading(
                    farmId,
                    Math.max(8, (previous?.soil_moisture ?? 42) - 3),
                  )
                : reading(farmId, previous?.soil_moisture ?? 42);
          stored[farmId].push(next);
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
        if (url.pathname === "/api/sensors/history") {
          const farmId = url.searchParams.get("farm_id");
          return route.fulfill({
            status: 200,
            headers,
            contentType: "application/json",
            body: JSON.stringify(stored[farmId] || []),
          });
        }
        if (url.pathname.includes("weather"))
          return route.fulfill({ status: 503, headers, body: "{}" });
        return route.fulfill({
          status: 200,
          headers,
          contentType: "application/json",
          body: JSON.stringify(
            url.pathname === "/api/farms" ? farms : farms[0],
          ),
        });
      });

      await page.goto(`${origin}/field-monitor`, { waitUntil: "networkidle" });
      await page
        .locator('select[aria-label="Selected farm"]')
        .selectOption("farm-a");
      await page.getByText("Demo Sensor Simulation", { exact: true }).waitFor();

      const scenario =
        width === 1024
          ? "Sensor Failure"
          : width === 768
            ? "Water Stress"
            : "Normal";
      await page.getByRole("button", { name: scenario, exact: true }).click();
      const start = page.getByRole("button", {
        name: "Start Simulation",
        exact: true,
      });
      await start.evaluate((element) => {
        element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
      await page.getByText("● Simulation running", { exact: true }).waitFor();
      await page.waitForTimeout(400);
      assert.equal(ticks["farm-a"], 1, `duplicate initial tick at ${width}px`);

      if (width === 1440) {
        await page.waitForTimeout(5200);
        assert.equal(
          ticks["farm-a"],
          2,
          "five-second timer did not generate one tick",
        );
        await page.getByRole("button", { name: "Stop Simulation" }).click();
        const stoppedAt = ticks["farm-a"];
        await page.waitForTimeout(5200);
        assert.equal(ticks["farm-a"], stoppedAt, "stop did not clear timer");
      } else if (width === 390) {
        await page
          .locator('select[aria-label="Selected farm"]')
          .selectOption("farm-b");
        await page.getByText("Simulation stopped", { exact: true }).waitFor();
        await page.waitForTimeout(5200);
        assert.equal(ticks["farm-b"], 0, "farm switch continued simulation");
        assert(!stored["farm-b"].some((item) => item.farm_id === "farm-a"));
      } else {
        await page.getByRole("button", { name: "Stop Simulation" }).click();
      }

      if (width === 1024) {
        await page.getByText("Sensor Issue", { exact: true }).first().waitFor();
      }
      if (width === 768) {
        failTick = true;
        await page.getByRole("button", { name: "Start Simulation" }).click();
        await page
          .getByText("Simulation temporarily unavailable", { exact: true })
          .waitFor();
      }
      if (width === 430) {
        await page.getByRole("button", { name: "Reset Demo Readings" }).click();
        await page
          .getByText("No simulated sensor readings available yet", {
            exact: true,
          })
          .first()
          .waitFor();
        assert.equal(stored["farm-a"].length, 0);
      }

      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
        `horizontal overflow at ${width}px`,
      );
      assert.deepEqual(errors, []);
      if (width === 1440 || width === 390) {
        await page.screenshot({
          path: `../.runtime/simulation-controller-${width}.png`,
          fullPage: true,
        });
      }
      console.log(`PASS field-monitor controller ${width}px`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
