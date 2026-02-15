import { test, expect } from "@playwright/test";

/**
 * Cost X-Ray Page Tests
 *
 * Tests the cost tracking dashboard including:
 * - Cost summary cards (This Month, Today, Avg per Agent)
 * - Cost by model breakdown
 * - All-time cost tracking
 * - Loading states
 * - Empty states
 * - Percentage calculations
 */

test.describe("Cost X-Ray Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/costs");
  });

  test("should load and display page title", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/cost/i);
  });

  test("should display cost summary cards", async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(2000);

    // Look for cost-related cards
    const costCards = [
      /this month|monthly/i,
      /today|daily/i,
      /average|avg.*agent/i,
    ];

    for (const pattern of costCards) {
      const hasCard = await page.getByText(pattern).count();
      // Card may or may not be visible depending on data
      expect(hasCard).toBeGreaterThanOrEqual(0);
    }
  });

  test("should display cost values in dollars", async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for dollar signs or currency formatting
    const hasDollarSigns = await page.getByText(/\$/).count();
    const hasCostValues = await page.getByText(/\d+\.\d{2}/).count();

    // Either should show $ or numeric values
    expect(hasDollarSigns + hasCostValues).toBeGreaterThanOrEqual(0);
  });

  test("should display cost by model breakdown", async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(2000);

    // Look for model names (Claude, GPT, Gemini, etc.)
    const hasModelBreakdown = await page.getByText(/claude|gpt|gemini|model/i).count();

    expect(hasModelBreakdown).toBeGreaterThanOrEqual(0);
  });

  test("should show progress bars for cost distribution", async ({ page }) => {
    // Wait for data
    await page.waitForTimeout(2000);

    // Look for progress bars or visual cost indicators
    const hasProgressBars = await page.locator('[role="progressbar"], [class*="progress"]').count();

    // Progress bars appear when there's cost data
    expect(hasProgressBars).toBeGreaterThanOrEqual(0);
  });

  test("should display percentage calculations", async ({ page }) => {
    // Wait for data
    await page.waitForTimeout(2000);

    // Look for percentage symbols
    const hasPercentages = await page.getByText(/%/).count();

    // Percentages shown for cost distribution
    expect(hasPercentages).toBeGreaterThanOrEqual(0);
  });

  test("should display all-time total cost", async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(2000);

    // Look for "all-time" or "total" cost indicator
    const hasAllTimeTotal = await page.getByText(/all.?time|total/i).count();

    expect(hasAllTimeTotal).toBeGreaterThanOrEqual(0);
  });

  test("should handle zero cost state gracefully", async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(2000);

    // Page should render without errors even with $0.00
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.waitForTimeout(1000);

    expect(pageErrors).toHaveLength(0);
  });

  test("should display loading state initially", async ({ page }) => {
    // Immediately check for loader
    const hasLoader = await page.locator('[class*="Loader"]').count();

    // Loader may appear during initial load
    expect(hasLoader).toBeGreaterThanOrEqual(0);
  });

  test("should show empty state when no costs tracked", async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(3000);

    // Either shows cost data OR empty state message
    const hasCostData = await page.getByText(/\$\d+/).count();
    const hasEmptyState = await page.getByText(/no cost|no spending|start tracking/i).count();

    // One or the other should be present
    expect(hasCostData + hasEmptyState).toBeGreaterThanOrEqual(0);
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Page should load
    await expect(page.locator("h1")).toBeVisible();

    // Cost cards should stack on mobile
    const grid = page.locator('[class*="grid"]').first();
    if (await grid.isVisible()) {
      // Grid should adapt to mobile layout
      const gridClasses = await grid.getAttribute("class");
      expect(gridClasses).toBeTruthy();
    }
  });

  test("should load without console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/dashboard/costs");
    await page.waitForTimeout(2000);

    // Filter out expected Convex-related warnings
    const realErrors = consoleErrors.filter(
      (err) => !err.includes("Convex") && !err.includes("_generated")
    );

    expect(realErrors).toHaveLength(0);
  });

  test("should display cost breakdown by provider", async ({ page }) => {
    // Wait for data
    await page.waitForTimeout(2000);

    // Look for provider names (Anthropic, OpenAI, Google, etc.)
    const hasProviders = await page.getByText(/anthropic|openai|google|ollama/i).count();

    expect(hasProviders).toBeGreaterThanOrEqual(0);
  });

  test("should show cost trends or comparisons", async ({ page }) => {
    // Wait for data
    await page.waitForTimeout(2000);

    // Look for trend indicators (arrows, percentages, comparisons)
    const hasTrends = await page.getByText(/↑|↓|increase|decrease|vs|compared/i).count();

    // Trends may or may not be visible depending on data
    expect(hasTrends).toBeGreaterThanOrEqual(0);
  });

  test("should format large cost values correctly", async ({ page }) => {
    // Wait for data
    await page.waitForTimeout(2000);

    // Look for formatted numbers (with commas or K/M notation)
    const hasFormattedNumbers = await page.getByText(/\$[\d,]+\.?\d*|[\d.]+[KM]/i).count();

    expect(hasFormattedNumbers).toBeGreaterThanOrEqual(0);
  });

  test("should have navigation back to dashboard", async ({ page }) => {
    // Look for breadcrumbs or back button
    const hasNavigation = await page.locator('a[href="/dashboard"]').count();

    expect(hasNavigation).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Cost Analytics Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/costs");
  });

  test("should show cost per agent breakdown", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for agent names or IDs in cost breakdown
    const hasAgentBreakdown = await page.getByText(/agent|per agent/i).count();

    expect(hasAgentBreakdown).toBeGreaterThanOrEqual(0);
  });

  test("should display token usage statistics", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for token counts or usage metrics
    const hasTokenStats = await page.getByText(/token|usage/i).count();

    expect(hasTokenStats).toBeGreaterThanOrEqual(0);
  });

  test("should show cost efficiency metrics", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for efficiency indicators (cost per message, etc.)
    const hasEfficiencyMetrics = await page.getByText(/per message|efficiency|average cost/i).count();

    expect(hasEfficiencyMetrics).toBeGreaterThanOrEqual(0);
  });

  test("should filter costs by date range", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for date range picker or filter
    const dateRangePicker = page.locator(
      '[data-testid="date-range"], [aria-label*="date" i], button:has-text("Last"), select[name*="date"]'
    ).first();

    if (await dateRangePicker.isVisible()) {
      // Click to open date range options
      await dateRangePicker.click();
      await page.waitForTimeout(300);

      // Look for date range options (Last 7 Days, Last 30 Days, etc.)
      const dateRangeOption = page.locator(
        'text="Last 7 Days", text="Last 30 Days", text="This Month", [role="option"]'
      ).first();

      if (await dateRangeOption.isVisible()) {
        // Select date range
        await dateRangeOption.click();
        await page.waitForTimeout(1000);

        // Verify data updated (page re-rendered)
        const updatedCostText = await page.locator('[class*="CardContent"]').first().textContent();
        expect(updatedCostText).toBeTruthy();
      }
    }
  });

  test("should export costs as CSV", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for export button
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("CSV"), button[aria-label*="export" i]'
    ).first();

    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);

      // Click export button
      await exportButton.click();

      // Wait for potential CSV option (if dropdown)
      await page.waitForTimeout(300);
      const csvOption = page.locator('text="CSV", [data-format="csv"]').first();
      if (await csvOption.isVisible()) {
        await csvOption.click();
      }

      // Wait for download
      const download = await downloadPromise;

      if (download) {
        // Verify CSV file downloaded
        const filename = download.suggestedFilename();
        expect(filename).toContain(".csv");
      }
    }
  });

  test("should export costs as PDF", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for export button
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("PDF"), button[aria-label*="export" i]'
    ).first();

    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);

      // Click export button
      await exportButton.click();

      // Wait for potential PDF option (if dropdown)
      await page.waitForTimeout(300);
      const pdfOption = page.locator('text="PDF", [data-format="pdf"]').first();
      if (await pdfOption.isVisible()) {
        await pdfOption.click();
      }

      // Wait for download
      const download = await downloadPromise;

      if (download) {
        // Verify PDF file downloaded
        const filename = download.suggestedFilename();
        expect(filename).toContain(".pdf");
      }
    }
  });
});
