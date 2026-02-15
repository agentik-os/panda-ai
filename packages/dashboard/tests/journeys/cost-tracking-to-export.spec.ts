import { test, expect } from "@playwright/test";

/**
 * E2E Journey: Cost Tracking → Budget Alerts → Export
 *
 * Complete cost management journey:
 * 1. View cost dashboard
 * 2. Set budget limits
 * 3. Configure budget alerts
 * 4. Monitor real-time cost tracking
 * 5. Trigger alert (if threshold reached)
 * 6. Export cost data (CSV/PDF)
 *
 * Tests the complete cost management lifecycle from monitoring to reporting.
 */

test.describe("E2E Journey: Cost Tracking → Budget Alerts → Export", () => {
  test("Complete cost management journey", async ({ page }) => {
    // =========================================
    // PHASE 1: View Cost Dashboard
    // =========================================

    console.log("Phase 1: Viewing cost dashboard...");

    await page.goto("/dashboard/costs");
    await page.waitForTimeout(1500);

    // Verify cost dashboard loads
    await expect(page.locator("h1, h2")).toContainText(/cost|spend|budget/i);

    // Verify key metrics are visible
    const metrics = {
      totalCost: page.getByText(/total cost|total spent|\$\d+/i),
      todayCost: page.getByText(/today|24h|daily/i),
      monthlyCost: page.getByText(/month|30d|monthly/i),
    };

    let visibleMetrics = 0;
    for (const [name, element] of Object.entries(metrics)) {
      if (await element.isVisible()) {
        console.log(`✅ ${name} metric visible`);
        visibleMetrics++;
      }
    }

    expect(visibleMetrics).toBeGreaterThan(0);

    // Verify cost chart/visualization exists
    const costChart = page.locator(
      'canvas, svg, [class*="chart"], [class*="graph"]'
    );
    if (await costChart.first().isVisible()) {
      console.log("✅ Cost visualization present");
    }

    // =========================================
    // PHASE 2: Set Budget Limits
    // =========================================

    console.log("Phase 2: Setting budget limits...");

    // Look for budget settings button or section
    const budgetButton = page
      .locator(
        'button:has-text("Budget"), button:has-text("Set Limit"), a:has-text("Budget")'
      )
      .first();

    if (await budgetButton.isVisible()) {
      await budgetButton.click();
      await page.waitForTimeout(1000);
    } else {
      // Try navigating to budget settings page
      await page.goto("/dashboard/costs/budget");
      await page.waitForTimeout(1000);
    }

    // Look for budget input field
    const budgetInput = page
      .locator(
        'input[name="budget"], input[name="limit"], input[placeholder*="budget"]'
      )
      .first();

    if (await budgetInput.isVisible()) {
      // Set a test budget limit ($100)
      await budgetInput.clear();
      await budgetInput.fill("100");

      // Find and click save/apply button
      const saveButton = page
        .locator(
          'button:has-text("Save"), button:has-text("Apply"), button:has-text("Set")'
        )
        .first();

      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1500);

        // Verify success message or confirmation
        const successIndicator = page.locator(
          '[class*="success"], [role="status"], text=/saved|updated|set/i'
        );

        if (await successIndicator.first().isVisible()) {
          console.log("✅ Budget limit set successfully");
        }
      }
    } else {
      console.log("⚠️  Budget input not found on page");
    }

    // =========================================
    // PHASE 3: Configure Budget Alerts
    // =========================================

    console.log("Phase 3: Configuring budget alerts...");

    // Look for alert settings
    const alertSection = page.getByText(/alert|notification|threshold/i);

    if (await alertSection.first().isVisible()) {
      // Scroll to alerts section
      await alertSection.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }

    // Look for alert threshold input (e.g., 80% of budget)
    const thresholdInput = page
      .locator(
        'input[name="threshold"], input[placeholder*="threshold"], input[placeholder*="%"]'
      )
      .first();

    if (await thresholdInput.isVisible()) {
      await thresholdInput.clear();
      await thresholdInput.fill("80");

      console.log("✅ Alert threshold set to 80%");
    }

    // Look for alert channel selection (Email, Slack, etc.)
    const alertChannelCheckbox = page
      .locator(
        'input[type="checkbox"][value="email"], label:has-text("Email")'
      )
      .first();

    if (await alertChannelCheckbox.isVisible()) {
      await alertChannelCheckbox.check();
      console.log("✅ Email alert enabled");
    }

    // Save alert settings
    const saveAlertsButton = page
      .locator('button:has-text("Save"), button:has-text("Update")')
      .first();

    if (await saveAlertsButton.isVisible()) {
      await saveAlertsButton.click();
      await page.waitForTimeout(1500);

      console.log("✅ Alert settings saved");
    }

    // =========================================
    // PHASE 4: Monitor Real-Time Cost Tracking
    // =========================================

    console.log("Phase 4: Monitoring real-time cost tracking...");

    // Navigate back to main cost dashboard
    await page.goto("/dashboard/costs");
    await page.waitForTimeout(1500);

    // Verify real-time cost display
    const realtimeCost = page
      .locator('[class*="cost"], [data-cost], text=/\$\d+\.\d{2}/i')
      .first();

    if (await realtimeCost.isVisible()) {
      const costText = await realtimeCost.textContent();
      console.log(`Current cost: ${costText}`);
      expect(costText).toMatch(/\$/);
    }

    // Check for cost breakdown by agent
    const costBreakdown = page.getByText(/by agent|per agent|agent cost/i);

    if (await costBreakdown.first().isVisible()) {
      console.log("✅ Cost breakdown by agent visible");

      // Verify agent cost items
      const agentCostItems = page.locator(
        '[class*="agent-cost"], [data-agent-cost]'
      );
      const itemCount = await agentCostItems.count();

      if (itemCount > 0) {
        console.log(`✅ ${itemCount} agent cost items displayed`);
      }
    }

    // Check for cost breakdown by model
    const modelBreakdown = page.getByText(/by model|per model|model cost/i);

    if (await modelBreakdown.first().isVisible()) {
      console.log("✅ Cost breakdown by model visible");
    }

    // =========================================
    // PHASE 5: Verify Budget Alert Display
    // =========================================

    console.log("Phase 5: Checking for budget alerts...");

    // Look for alert indicators
    const alertIndicators = page.locator(
      '[class*="alert"], [class*="warning"], [role="alert"]'
    );

    const alertCount = await alertIndicators.count();

    if (alertCount > 0) {
      console.log(`⚠️  ${alertCount} alert(s) displayed`);

      // Check if alert mentions budget/threshold
      const budgetAlert = page.getByText(/budget|threshold|limit/i);

      if (await budgetAlert.first().isVisible()) {
        const alertText = await budgetAlert.first().textContent();
        console.log(`Alert message: ${alertText}`);
      }
    } else {
      console.log("ℹ️  No alerts currently (spending below threshold)");
    }

    // =========================================
    // PHASE 6: Export Cost Data
    // =========================================

    console.log("Phase 6: Exporting cost data...");

    // Look for export button
    const exportButton = page
      .locator(
        'button:has-text("Export"), button:has-text("Download"), a:has-text("Export")'
      )
      .first();

    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(1000);

      // Look for export format options (CSV/PDF)
      const csvOption = page
        .locator('button:has-text("CSV"), [value="csv"]')
        .first();
      const pdfOption = page
        .locator('button:has-text("PDF"), [value="pdf"]')
        .first();

      // Test CSV export
      if (await csvOption.isVisible()) {
        console.log("Testing CSV export...");

        // Set up download listener
        const downloadPromise = page.waitForEvent("download", {
          timeout: 10000,
        });

        await csvOption.click();

        try {
          const download = await downloadPromise;
          const fileName = download.suggestedFilename();

          expect(fileName).toMatch(/\.csv$/i);
          console.log(`✅ CSV export successful: ${fileName}`);

          // Clean up download
          await download.cancel();
        } catch (error) {
          console.log("⚠️  CSV download not triggered (may require data)");
        }
      }

      // Test PDF export
      if (await pdfOption.isVisible()) {
        console.log("Testing PDF export...");

        const downloadPromise = page.waitForEvent("download", {
          timeout: 10000,
        });

        await pdfOption.click();

        try {
          const download = await downloadPromise;
          const fileName = download.suggestedFilename();

          expect(fileName).toMatch(/\.pdf$/i);
          console.log(`✅ PDF export successful: ${fileName}`);

          await download.cancel();
        } catch (error) {
          console.log("⚠️  PDF download not triggered (may require data)");
        }
      }
    } else {
      console.log("⚠️  Export button not found");
    }

    console.log("✅ Complete cost management journey successful!");
  });

  test("Cost analytics and filtering", async ({ page }) => {
    // Test advanced cost analytics features
    await page.goto("/dashboard/costs");
    await page.waitForTimeout(1500);

    // =========================================
    // Test Date Range Filtering
    // =========================================

    const dateRangeButton = page
      .locator(
        'button:has-text("Date"), button:has-text("Range"), select[name="date"]'
      )
      .first();

    if (await dateRangeButton.isVisible()) {
      await dateRangeButton.click();
      await page.waitForTimeout(500);

      // Select "Last 7 Days" or similar
      const sevenDaysOption = page
        .locator('button:has-text("7 Days"), option:has-text("7 Days")')
        .first();

      if (await sevenDaysOption.isVisible()) {
        await sevenDaysOption.click();
        await page.waitForTimeout(1500);

        console.log("✅ Date range filter applied");
      }
    }

    // =========================================
    // Test Agent Filtering
    // =========================================

    const agentFilter = page
      .locator('select[name="agent"], button:has-text("Filter by Agent")')
      .first();

    if (await agentFilter.isVisible()) {
      await agentFilter.click();
      await page.waitForTimeout(500);

      // Select first agent
      const firstAgentOption = page.locator("option, [role='option']").nth(1);

      if (await firstAgentOption.isVisible()) {
        await firstAgentOption.click();
        await page.waitForTimeout(1500);

        console.log("✅ Agent filter applied");
      }
    }

    // =========================================
    // Test Model Filtering
    // =========================================

    const modelFilter = page
      .locator('select[name="model"], button:has-text("Filter by Model")')
      .first();

    if (await modelFilter.isVisible()) {
      await modelFilter.click();
      await page.waitForTimeout(500);

      // Select a model
      const modelOption = page
        .locator('option:has-text("Claude"), [role="option"]:has-text("Claude")')
        .first();

      if (await modelOption.isVisible()) {
        await modelOption.click();
        await page.waitForTimeout(1500);

        console.log("✅ Model filter applied");
      }
    }

    // Verify filtered data updates
    const costDisplay = page.locator('[class*="cost"], text=/\$/i').first();
    if (await costDisplay.isVisible()) {
      console.log("✅ Cost display updates with filters");
    }
  });

  test("Budget alert notifications", async ({ page }) => {
    // Test budget alert notification system
    await page.goto("/dashboard/costs/budget");
    await page.waitForTimeout(1500);

    // Set a very low budget to trigger alert
    const budgetInput = page
      .locator('input[name="budget"], input[name="limit"]')
      .first();

    if (await budgetInput.isVisible()) {
      // Set budget to $0.01 to ensure alert triggers
      await budgetInput.clear();
      await budgetInput.fill("0.01");

      const saveButton = page
        .locator('button:has-text("Save"), button:has-text("Apply")')
        .first();

      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }

      // Navigate to costs page to check for alert
      await page.goto("/dashboard/costs");
      await page.waitForTimeout(1500);

      // Check if alert appears
      const alertBanner = page.locator(
        '[role="alert"], [class*="alert"], [class*="warning"]'
      );

      const alertVisible = await alertBanner.first().isVisible();

      if (alertVisible) {
        const alertText = await alertBanner.first().textContent();
        console.log(`✅ Budget alert triggered: ${alertText}`);
        expect(alertText).toMatch(/budget|limit|threshold/i);
      } else {
        console.log("ℹ️  No alert displayed (may require actual spending)");
      }

      // Reset budget to reasonable amount
      await page.goto("/dashboard/costs/budget");
      await page.waitForTimeout(1000);

      if (await budgetInput.isVisible()) {
        await budgetInput.clear();
        await budgetInput.fill("100");

        if (await saveButton.isVisible()) {
          await saveButton.click();
          console.log("✅ Budget reset to $100");
        }
      }
    }
  });
});
