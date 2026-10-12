import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 180000,
  use: { baseURL: "http://127.0.0.1:3006", browserName: "chromium" },
  webServer: {
    command: "npm run start -- -p 3006",
    url: "http://127.0.0.1:3006",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
