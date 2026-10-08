// Requires Playwright (or PLAYWRIGHT_MODULE pointing at a local installation).
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = process.env.AGRIOS_FRONTEND_URL || "http://127.0.0.1:3006";
const farms = ["farm-a", "farm-b"].map((id, i) => ({
  id,
  name: `Farm ${i ? "B" : "A"}`,
  farmer_name: "Test farmer",
  location_name: `Location ${i}`,
  latitude: 10 + i,
  longitude: 78,
  area_acres: 10,
  current_crop: "Paddy",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));
const reading = (farm, value) => ({
  id: `${farm}-${value}`,
  farm_id: farm,
  field_id: "field-1",
  soil_moisture: value,
  temperature: 31,
  humidity: 66,
  source: "simulator",
  recorded_at: new Date().toISOString(),
  timestamp: new Date().toISOString(),
  sensor_status: "healthy",
  validation_issues: [],
});

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    for (const route of ["field-monitor", "overview"]) {
      for (const width of [1440, 768, 390]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
        });
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        let mode = "empty",
          second = false;
        const requests = [];
        await page.route("**/api/**", async (r) => {
          const url = new URL(r.request().url());
          const headers = {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "Content-Type",
          };
          if (url.pathname.includes("sensors")) {
            requests.push(url.searchParams.get("farm_id"));
            if (mode === "error")
              return r.fulfill({ status: 503, headers, body: "{}" });
            const farm = url.searchParams.get("farm_id");
            const data =
              mode === "empty"
                ? []
                : farm === "farm-b"
                  ? [reading(farm, 73)]
                  : [reading(farm, 42), ...(second ? [reading(farm, 37)] : [])];
            if (mode === "suspicious")
              data[data.length - 1] = {
                ...reading(farm, 95),
                sensor_status: "suspicious",
                validation_issues: ["Sudden soil_moisture jump; verify sensor"],
              };
            return r.fulfill({
              status: 200,
              headers,
              contentType: "application/json",
              body: JSON.stringify(data),
            });
          }
          if (url.pathname.includes("weather"))
            return r.fulfill({ status: 503, headers, body: "{}" });
          return r.fulfill({
            status: 200,
            headers,
            contentType: "application/json",
            body: JSON.stringify(
              url.pathname === "/api/farms" ? farms : farms[0],
            ),
          });
        });
        await page.goto(`${origin}/${route}`, { waitUntil: "networkidle" });
        const scope =
          route === "overview"
            ? page.locator(".field-summary")
            : page.locator("main");
        await scope
          .getByText("No simulated sensor readings available yet", {
            exact: true,
          })
          .first()
          .waitFor();
        mode = "ready";
        await scope
          .getByText(
            route === "field-monitor" ? /Prototype Data/ : /Simulated IoT Data/,
          )
          .first()
          .waitFor({ timeout: 15000 });
        await scope.locator(".recharts-surface").first().waitFor();
        if (route === "field-monitor")
          await scope.getByText("42%", { exact: true }).first().waitFor();
        second = true;
        if (route === "field-monitor")
          await scope
            .getByText("37%", { exact: true })
            .first()
            .waitFor({ timeout: 15000 });
        else await page.waitForTimeout(5500);
        await page
          .locator('select[aria-label="Selected farm"]')
          .selectOption("farm-b");
        await page.waitForTimeout(500);
        assert(
          !(await scope.getByText("37%", { exact: true }).count()),
          "Prior farm measurements leaked",
        );
        if (route === "field-monitor")
          await scope.getByText("73%", { exact: true }).first().waitFor();
        else
          await scope
            .getByText(/Simulated IoT Data/)
            .first()
            .waitFor();
        assert(requests.includes("farm-a") && requests.includes("farm-b"));
        mode = "suspicious";
        if (route === "field-monitor") {
          await scope
            .getByText("Sensor Issue", { exact: true })
            .first()
            .waitFor({ timeout: 15000 });
          assert(!(await scope.getByText(/^Critical:/).count()));
        } else await page.waitForTimeout(5500);
        mode = "error";
        await scope
          .getByText("Sensor readings temporarily unavailable", { exact: true })
          .first()
          .waitFor({ timeout: 15000 });
        assert(!(await scope.getByText("95%", { exact: true }).count()));
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          true,
          "Horizontal overflow",
        );
        assert.deepEqual(errors, []);
        console.log(
          `PASS ${route} ${width}px: empty, polling, farm switch, quality, error, responsive`,
        );
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
