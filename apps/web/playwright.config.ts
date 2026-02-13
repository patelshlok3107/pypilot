import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3005);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
