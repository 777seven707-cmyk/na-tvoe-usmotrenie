import { defineConfig, devices } from "@playwright/test";

// Expects the web app at E2E_BASE_URL (default http://localhost:3000) with the API behind it.
// `make e2e` (see DEVELOPMENT.md) starts both before running the suite.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: process.env.PW_CHROMIUM_PATH
          ? { executablePath: process.env.PW_CHROMIUM_PATH }
          : {},
      },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
