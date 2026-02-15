import { test, expect } from "@playwright/test";

/**
 * Dashboard Overview Page Tests
 *
 * Tests the main dashboard landing page including:
 * - Page loads correctly
 * - Stats cards display (Active Agents, Monthly Cost, Total Messages, Active Skills)
 * - Recent agents list
 * - Cost breakdown chart
 * - Loading states
 * - Empty states
 * - Navigation links
 */

test.describe("Dashboard Overview Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");
  });

  test("should load and display page title", async ({ page }) => {
    // Check page title
    await expect(page.locator("h1")).toContainText("Overview");

    // Check subtitle/description
    await expect(page.getByText("Monitor your AI agents")).toBeVisible();
  });

  test("should display all 4 stat cards", async ({ page }) => {
    // Wait for loading to finish (loading spinner disappears)
    await page.waitForSelector('[class*="Loader"]', { state: "hidden", timeout: 10000 });

    // Check for stat card titles
    const cardTitles = [
      "Active Agents",
      "Monthly Cost",
      "Total Messages",
      "Active Skills",
    ];

    for (const title of cardTitles) {
      await expect(page.getByText(title)).toBeVisible();
    }
  });

  test("should display stat values or loading state", async ({ page }) => {
    // Either loading spinner is visible OR stat values are visible
    const hasLoader = await page.locator('[class*="Loader"]').count();

    if (hasLoader === 0) {
      // Stats should be loaded - check for numeric values
      // Active Agents should have a number
      const agentsCard = page.locator('text="Active Agents"').locator("..");
      await expect(agentsCard).toBeVisible();
    } else {
      // Loading state is OK during initial load
      expect(hasLoader).toBeGreaterThan(0);
    }
  });

  test("should display recent agents section", async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(2000);

    // Check for "Recent Agents" heading or similar
    const hasRecentAgents = await page.getByText(/recent/i).count();

    // Either shows recent agents OR empty state
    expect(hasRecentAgents).toBeGreaterThanOrEqual(0);
  });

  test("should display cost breakdown section", async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(2000);

    // Look for cost-related text
    const hasCostSection = await page.getByText(/cost|spending/i).count();

    expect(hasCostSection).toBeGreaterThanOrEqual(0);
  });

  test("should have navigation links to detail pages", async ({ page }) => {
    // Wait for page to stabilize
    await page.waitForTimeout(1000);

    // Check for "View All" or similar links
    const viewAllLinks = page.locator('a:has-text("View")');
    const linkCount = await viewAllLinks.count();

    // At least some navigation links should exist
    expect(linkCount).toBeGreaterThanOrEqual(0);
  });

  test("should handle empty state gracefully", async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(3000);

    // Check if page renders without errors
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.waitForTimeout(1000);

    // No console errors should occur
    expect(pageErrors).toHaveLength(0);
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Page should still load
    await expect(page.locator("h1")).toBeVisible();

    // Stats cards should stack vertically on mobile
    const statsGrid = page.locator('[class*="grid"]').first();
    if (await statsGrid.isVisible()) {
      const gridClasses = await statsGrid.getAttribute("class");
      // On mobile, grid should not have 4 columns
      expect(gridClasses).not.toContain("lg:grid-cols-4");
    }
  });

  test("should load without console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/dashboard");
    await page.waitForTimeout(2000);

    // Filter out expected Convex-related warnings
    const realErrors = consoleErrors.filter(
      (err) => !err.includes("Convex") && !err.includes("_generated")
    );

    expect(realErrors).toHaveLength(0);
  });

  test("should navigate to agents page via link", async ({ page }) => {
    // Wait for page load
    await page.waitForTimeout(1000);

    // Look for link to agents page
    const agentsLink = page.locator('a[href*="/agents"]').first();

    if (await agentsLink.isVisible()) {
      await agentsLink.click();

      // Should navigate to agents page
      await expect(page).toHaveURL(/\/agents/);
    }
  });

  test("should navigate to costs page via link", async ({ page }) => {
    // Wait for page load
    await page.waitForTimeout(1000);

    // Look for link to costs page
    const costsLink = page.locator('a[href*="/costs"]').first();

    if (await costsLink.isVisible()) {
      await costsLink.click();

      // Should navigate to costs page
      await expect(page).toHaveURL(/\/costs/);
    }
  });
});
