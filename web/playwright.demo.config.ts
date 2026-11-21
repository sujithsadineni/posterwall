import { defineConfig, devices } from "@playwright/test";

// The GitHub Pages build: no API, the GraphQL schema runs in the browser. Served under /posterwall/ like Pages does.
const PORT = 5191;
export default defineConfig({
  testDir: "e2e-demo",
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}/posterwall/`, channel: "chrome", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "phone", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
  webServer: {
    command: `npm run build:demo && npx vite preview --mode demo --outDir dist-demo --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/posterwall/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
