import { expect, test } from "@playwright/test";

const ROUTES: [string, string][] = [
  ["/projects", "Projects"],
  ["/workspace", "Research Workspace"],
  ["/inspect/web", "Web Inspector"],
  ["/inspect/api", "API Inspector"],
  ["/inspect/android", "Android Inspector"],
  ["/inspect/windows", "Windows Inspector"],
  ["/inspect/network", "Network Analyzer"],
  ["/inspect/code", "Code Explorer"],
  ["/audit", "Security Audit"],
  ["/findings", "Findings"],
  ["/reports", "Reports"],
  ["/tools", "Tools"],
  ["/settings", "Settings"],
];

test("dashboard shows live system health from the backend", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  const health = page.getByRole("region", { name: "System health" });
  await expect(health.getByText("PostgreSQL")).toBeVisible();
  await expect(health.getByText("Redis")).toBeVisible();
  await expect(health.getByText(/^ok · /).first()).toBeVisible();
});

test("every planned page renders and is honestly labelled", async ({ page }) => {
  for (const [path, title] of ROUTES) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText("Not implemented yet")).toBeVisible();
  }
});

test("sidebar navigation marks the active page", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop sidebar");
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Findings" }).click();
  await expect(page).toHaveURL(/\/findings$/);
  await expect(
    page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Findings" }),
  ).toHaveAttribute("aria-current", "page");
});

test("mobile navigation drawer opens and navigates", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const drawer = page.getByRole("dialog", { name: "Navigation" });
  await drawer.getByRole("link", { name: "Reports" }).click();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(drawer).toBeHidden();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("emergency stop is visible but disabled until the execution engine exists", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "STOP" })).toBeDisabled();
});

test("API is proxied same-origin with security headers", async ({ request }) => {
  const res = await request.get("/api/v1/health/live");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["x-request-id"]).toBeTruthy();
});
