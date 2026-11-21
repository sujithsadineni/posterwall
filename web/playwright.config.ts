import { defineConfig, devices } from "@playwright/test";

// End-to-end: a separate database (posterwall_e2e) and ports, so dev data and dev servers are untouched.
const API_PORT = 4110;
const WEB_PORT = 5190;
const env = {
  DATABASE_URL: "postgres://localhost:5432/posterwall_e2e",
  PORT: String(API_PORT),
  JWT_SECRET: "e2e-secret-at-least-32-characters-long",
  NODE_ENV: "test",
  UPLOAD_DIR: "uploads-e2e",
};

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1, // one shared database, reseeded before each test
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    channel: "chrome", // the installed Google Chrome: no browser download
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "phone", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
  webServer: [
    {
      command: "npm run start -w api",
      cwd: "..",
      url: `http://127.0.0.1:${API_PORT}/graphql?query=%7B__typename%7D`,
      env,
      reuseExistingServer: false,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_URL: `http://127.0.0.1:${API_PORT}` },
      reuseExistingServer: false,
    },
  ],
});
