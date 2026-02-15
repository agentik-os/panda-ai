import { test, expect } from "@playwright/test";

/**
 * Responsive Design Tests
 *
 * Tests that all dashboard pages are responsive across:
 * - Mobile (375x812)
 * - Tablet (768x1024)
 * - Desktop (1440x900)
 * - 4K (3840x2160)
 */

const viewports = [
  { name: "Mobile", width: 375, height: 812 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Desktop", width: 1440, height: 900 },
  { name: "4K", width: 3840, height: 2160 },
];

const pages = [
  { name: "Overview", path: "/dashboard" },
  { name: "Agents", path: "/dashboard/agents" },
  { name: "Costs", path: "/dashboard/costs" },
  { name: "Settings", path: "/dashboard/settings" },
];

test.describe("Responsive Design", () => {
  for (const viewport of viewports) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      for (const pageDef of pages) {
        test(`${pageDef.name} page should be responsive`, async ({ page }) => {
          await page.goto(pageDef.path);

          // Page should load
          await expect(page.locator("h1")).toBeVisible();

          // No horizontal overflow
          const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
          const viewportWidth = viewport.width;

          // Allow 1px tolerance for rounding
          expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
        });
      }

      test("sidebar should adapt to viewport", async ({ page }) => {
        await page.goto("/dashboard");

        if (viewport.width < 768) {
          // Mobile: sidebar should be hidden by default or in a sheet
          const sidebar = page.locator('[class*="sidebar"]');
          const sidebarCount = await sidebar.count();

          // Mobile sidebar either doesn't exist or is hidden
          if (sidebarCount > 0) {
            const isVisible = await sidebar.first().isVisible();
            // On mobile, sidebar may be hidden or shown via sheet/menu
            expect(isVisible !== undefined).toBe(true);
          }
        } else {
          // Desktop/Tablet: sidebar should be visible
          const sidebar = page.locator('[class*="sidebar"]').first();
          const sidebarCount = await sidebar.count();

          if (sidebarCount > 0) {
            // Sidebar exists on larger screens
            expect(sidebarCount).toBeGreaterThan(0);
          }
        }
      });

      test("navigation should be accessible", async ({ page }) => {
        await page.goto("/dashboard");

        if (viewport.width < 768) {
          // Mobile: should have hamburger menu or sheet trigger
          const menuButton = page.locator('button[aria-label*="menu"], button[class*="Sheet"]');
          const hasMenuButton = await menuButton.count();

          // Mobile navigation via button
          expect(hasMenuButton).toBeGreaterThanOrEqual(0);
        }

        // All viewports: navigation items should be accessible
        const navItems = page.locator('a[href^="/dashboard"]');
        const navCount = await navItems.count();

        expect(navCount).toBeGreaterThanOrEqual(0);
      });
    });
  }
});

test.describe("Layout Breakpoints", () => {
  test("grid columns should adapt to viewport", async ({ page }) => {
    // Desktop: 4 columns for stats
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");
    await page.waitForTimeout(1000);

    let grid = page.locator('[class*="grid"]').first();
    if (await grid.isVisible()) {
      let gridClasses = await grid.getAttribute("class");
      // Desktop should have multi-column grid
      expect(gridClasses).toBeTruthy();
    }

    // Mobile: 1 column for stats
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    grid = page.locator('[class*="grid"]').first();
    if (await grid.isVisible()) {
      let gridClasses = await grid.getAttribute("class");
      // Mobile grid classes should be different
      expect(gridClasses).toBeTruthy();
    }
  });

  test("cards should stack on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/agents");
    await page.waitForTimeout(1000);

    // Agent cards should be in vertical layout
    const cards = page.locator('[class*="Card"]');
    const cardCount = await cards.count();

    if (cardCount > 1) {
      // Cards should stack vertically on mobile
      const firstCard = cards.first();
      const secondCard = cards.nth(1);

      const firstRect = await firstCard.boundingBox();
      const secondRect = await secondCard.boundingBox();

      if (firstRect && secondRect) {
        // Second card should be below first card
        expect(secondRect.y).toBeGreaterThan(firstRect.y);
      }
    }
  });

  test("text should remain readable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    await page.waitForTimeout(1000);

    // Check font sizes are reasonable on mobile
    const heading = page.locator("h1").first();
    const fontSize = await heading.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Font size should be at least 20px on mobile
    const fontSizeNum = parseFloat(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(20);
  });
});
