import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for Agentik OS Dashboard
 *
 * Tests the full dashboard UI including:
 * - All pages (overview, agents, costs, settings)
 * - Agent creation wizard
 * - Real-time Convex updates
 * - Responsive layouts (mobile, tablet, desktop)
 */

// Use PORT from environment or default to 3000
const PORT = process.env.PORT || 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",

  // Test timeout: 30 seconds per test
  timeout: 30 * 1000,

  // Global test setup/teardown timeout
  globalTimeout: 60 * 60 * 1000, // 1 hour for full suite

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reporter to use
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"], // Terminal output
    ["json", { outputFile: "test-results.json" }],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL,

    // Collect trace only on failure
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true,

    // Maximum time for actions (click, fill, etc.)
    actionTimeout: 10 * 1000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1440, height: 900 },
      },
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1440, height: 900 },
      },
    },

    // Mobile viewports
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
    },

    {
      name: "mobile-safari",
      use: {
        ...devices["iPhone 12"],
      },
    },

    // Tablet viewport
    {
      name: "tablet",
      use: {
        ...devices["iPad Pro"],
      },
    },
  ],

  // Run local dev server before tests (if not already running)
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start
    stdout: "pipe",
    stderr: "pipe",
  },
});
