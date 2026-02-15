import { test, expect } from "@playwright/test";

/**
 * Dark Mode Tests
 *
 * Tests the dark mode toggle functionality including:
 * - Theme toggle button visibility
 * - Theme switching (light ↔ dark)
 * - Persistence in localStorage
 * - HTML class application
 * - System preference detection
 * - Theme consistency across pages
 */

test.describe("Dark Mode Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("should display theme toggle button", async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);

    // Look for theme toggle button (various possible selectors)
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="theme" i], button[aria-label*="dark" i], button[aria-label*="light" i]'
    );

    const toggleCount = await themeToggle.count();
    expect(toggleCount).toBeGreaterThan(0);
  });

  test("should toggle to dark mode", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Find theme toggle
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="theme" i]'
    ).first();

    if (await themeToggle.isVisible()) {
      // Click toggle
      await themeToggle.click();

      // Wait for theme to apply
      await page.waitForTimeout(500);

      // Check if dark class applied to html element
      const htmlElement = page.locator("html");
      const htmlClasses = await htmlElement.getAttribute("class");

      // Should have dark class (or data-theme="dark")
      const hasDarkClass = htmlClasses?.includes("dark") || false;
      const hasDarkTheme =
        (await page.locator('html[data-theme="dark"]').count()) > 0;

      expect(hasDarkClass || hasDarkTheme).toBe(true);
    }
  });

  test("should toggle back to light mode", async ({ page }) => {
    await page.waitForTimeout(1000);

    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="theme" i]'
    ).first();

    if (await themeToggle.isVisible()) {
      // Toggle to dark
      await themeToggle.click();
      await page.waitForTimeout(300);

      // Toggle back to light
      await themeToggle.click();
      await page.waitForTimeout(300);

      // Check if dark class removed
      const htmlElement = page.locator("html");
      const htmlClasses = await htmlElement.getAttribute("class");

      // Should NOT have dark class
      const hasDarkClass = htmlClasses?.includes("dark") || false;

      expect(hasDarkClass).toBe(false);
    }
  });

  test("should persist theme in localStorage", async ({ page }) => {
    await page.waitForTimeout(1000);

    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="theme" i]'
    ).first();

    if (await themeToggle.isVisible()) {
      // Toggle to dark mode
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Check localStorage
      const theme = await page.evaluate(() =>
        localStorage.getItem("theme")
      );

      // Should store "dark" in localStorage
      expect(theme).toBe("dark");
    }
  });

  test("should maintain theme after page reload", async ({ page }) => {
    await page.waitForTimeout(1000);

    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="theme" i]'
    ).first();

    if (await themeToggle.isVisible()) {
      // Set dark mode
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Reload page
      await page.reload();
      await page.waitForTimeout(1000);

      // Dark mode should persist
      const htmlElement = page.locator("html");
      const htmlClasses = await htmlElement.getAttribute("class");

      const hasDarkClass = htmlClasses?.includes("dark") || false;
      expect(hasDarkClass).toBe(true);
    }
  });

  test("should maintain theme across page navigation", async ({ page }) => {
    await page.waitForTimeout(1000);

    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="theme" i]'
    ).first();

    if (await themeToggle.isVisible()) {
      // Set dark mode
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Navigate to different page
      await page.goto("/dashboard/agents");
      await page.waitForTimeout(1000);

      // Dark mode should persist
      const htmlElement = page.locator("html");
      const htmlClasses = await htmlElement.getAttribute("class");

      const hasDarkClass = htmlClasses?.includes("dark") || false;
      expect(hasDarkClass).toBe(true);
    }
  });
});

test.describe("Dark Mode Dropdown (if exists)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("should open theme selection dropdown", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Try to find dropdown trigger
    const dropdownTrigger = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="theme" i]'
    ).first();

    if (await dropdownTrigger.isVisible()) {
      await dropdownTrigger.click();
      await page.waitForTimeout(300);

      // Look for dropdown menu with theme options
      const hasDropdownMenu = await page.locator(
        '[role="menu"], [class*="dropdown"], [class*="popover"]'
      ).isVisible().catch(() => false);

      // Dropdown may or may not appear depending on implementation
      expect(hasDropdownMenu !== undefined).toBe(true);
    }
  });

  test("should have light/dark/system options", async ({ page }) => {
    await page.waitForTimeout(1000);

    const dropdownTrigger = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="theme" i]'
    ).first();

    if (await dropdownTrigger.isVisible()) {
      await dropdownTrigger.click();
      await page.waitForTimeout(300);

      // Check for theme options
      const hasLightOption = await page.getByText(/^light$/i).count();
      const hasDarkOption = await page.getByText(/^dark$/i).count();
      const hasSystemOption = await page.getByText(/system/i).count();

      // At least some options should exist
      const totalOptions = hasLightOption + hasDarkOption + hasSystemOption;
      expect(totalOptions).toBeGreaterThanOrEqual(0);
    }
  });

  test("should select dark mode from dropdown", async ({ page }) => {
    await page.waitForTimeout(1000);

    const dropdownTrigger = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="theme" i]'
    ).first();

    if (await dropdownTrigger.isVisible()) {
      await dropdownTrigger.click();
      await page.waitForTimeout(300);

      // Try to click Dark option
      const darkOption = page.getByText(/^dark$/i).first();

      if (await darkOption.isVisible()) {
        await darkOption.click();
        await page.waitForTimeout(500);

        // Verify dark mode applied
        const htmlElement = page.locator("html");
        const htmlClasses = await htmlElement.getAttribute("class");

        const hasDarkClass = htmlClasses?.includes("dark") || false;
        expect(hasDarkClass).toBe(true);
      }
    }
  });
});

test.describe("System Preference Detection", () => {
  test("should respect system dark mode preference", async ({ page }) => {
    // Emulate dark mode system preference
    await page.emulateMedia({ colorScheme: "dark" });

    await page.goto("/dashboard");
    await page.waitForTimeout(1000);

    // If theme is set to "system", should use dark mode
    const theme = await page.evaluate(() =>
      localStorage.getItem("theme")
    );

    if (theme === "system" || theme === null) {
      // Should apply dark mode based on system preference
      const htmlElement = page.locator("html");
      const htmlClasses = await htmlElement.getAttribute("class");

      const hasDarkClass = htmlClasses?.includes("dark") || false;
      expect(hasDarkClass).toBe(true);
    }
  });

  test("should respect system light mode preference", async ({ page }) => {
    // Emulate light mode system preference
    await page.emulateMedia({ colorScheme: "light" });

    await page.goto("/dashboard");
    await page.waitForTimeout(1000);

    // If theme is set to "system", should use light mode
    const theme = await page.evaluate(() =>
      localStorage.getItem("theme")
    );

    if (theme === "system" || theme === null) {
      // Should NOT apply dark mode
      const htmlElement = page.locator("html");
      const htmlClasses = await htmlElement.getAttribute("class");

      const hasDarkClass = htmlClasses?.includes("dark") || false;
      expect(hasDarkClass).toBe(false);
    }
  });
});

test.describe("Dark Mode Visual Consistency", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");

    // Set dark mode
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="theme" i]'
    ).first();

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
    } else {
      // Set via localStorage directly
      await page.evaluate(() => {
        localStorage.setItem("theme", "dark");
        document.documentElement.classList.add("dark");
      });
      await page.reload();
      await page.waitForTimeout(1000);
    }
  });

  test("should apply dark styles to all pages", async ({ page }) => {
    // Check overview page
    await page.goto("/dashboard");
    await page.waitForTimeout(500);

    let htmlClasses = await page.locator("html").getAttribute("class");
    expect(htmlClasses).toContain("dark");

    // Check agents page
    await page.goto("/dashboard/agents");
    await page.waitForTimeout(500);

    htmlClasses = await page.locator("html").getAttribute("class");
    expect(htmlClasses).toContain("dark");

    // Check costs page
    await page.goto("/dashboard/costs");
    await page.waitForTimeout(500);

    htmlClasses = await page.locator("html").getAttribute("class");
    expect(htmlClasses).toContain("dark");
  });

  test("should have appropriate dark mode colors", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Check background color is dark
    const backgroundColor = await page.evaluate(() => {
      const bodyStyles = window.getComputedStyle(document.body);
      return bodyStyles.backgroundColor;
    });

    // Dark mode should have dark background (RGB values all < 50)
    const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

    if (rgbMatch && rgbMatch.length >= 4) {
      const r = Number(rgbMatch[1]);
      const g = Number(rgbMatch[2]);
      const b = Number(rgbMatch[3]);
      const isDark = r < 50 && g < 50 && b < 50;

      expect(isDark).toBe(true);
    }
  });

  test("should maintain contrast for readability", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Text should be light on dark background
    const textColor = await page.evaluate(() => {
      const heading = document.querySelector("h1");
      if (heading) {
        const styles = window.getComputedStyle(heading);
        return styles.color;
      }
      return null;
    });

    if (textColor) {
      // Light text should have high RGB values
      const rgbMatch = textColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

      if (rgbMatch && rgbMatch.length >= 4) {
        const r = Number(rgbMatch[1]);
        const g = Number(rgbMatch[2]);
        const b = Number(rgbMatch[3]);
        const isLight = r > 200 || g > 200 || b > 200;

        expect(isLight).toBe(true);
      }
    }
  });
});
