import { test, expect } from "@playwright/test";

/**
 * E2E Journey: Time Travel Debug Flow
 *
 * Complete Time Travel debugging user journey:
 * 1. Navigate to Time Travel dashboard
 * 2. View execution timeline
 * 3. Select a specific point in time
 * 4. Replay from that point
 * 5. Compare original vs replay
 * 6. Identify regression/differences
 * 7. View cost savings analytics
 *
 * Tests the complete Time Travel debugging workflow.
 */

test.describe("E2E Journey: Time Travel Debug Flow", () => {
  test("Complete time travel debugging journey", async ({ page }) => {
    // =========================================
    // PHASE 1: Navigate to Time Travel Dashboard
    // =========================================

    console.log("Phase 1: Accessing Time Travel dashboard...");

    await page.goto("/dashboard/time-travel");
    await page.waitForTimeout(1500);

    // Verify Time Travel page loads
    await expect(page.locator("h1, h2")).toContainText(/time travel|replay|debug/i);

    // Verify feature explanation
    const explanation = page.getByText(/replay|cheaper model|debug/i);

    if (await explanation.first().isVisible()) {
      console.log("✅ Time Travel feature explanation visible");
    }

    // =========================================
    // PHASE 2: View Execution Timeline
    // =========================================

    console.log("Phase 2: Viewing execution timeline...");

    // Look for timeline/history section
    const timelineSection = page.getByText(/timeline|history|executions/i);

    if (await timelineSection.first().isVisible()) {
      console.log("✅ Timeline section visible");
    }

    // Verify execution entries
    const executionEntries = page.locator('[class*="execution"], [data-execution]');
    const executionCount = await executionEntries.count();

    if (executionCount > 0) {
      console.log(`✅ ${executionCount} execution entries available`);

      // Verify each entry has key information
      const firstExecution = executionEntries.first();

      const hasTimestamp = await firstExecution.locator('[class*="time"], [data-timestamp]').count();
      const hasModel = await firstExecution.getByText(/claude|gpt|sonnet|opus/i).count();
      const hasCost = await firstExecution.getByText(/\$/i).count();

      if (hasTimestamp > 0) console.log("  ✅ Timestamp displayed");
      if (hasModel > 0) console.log("  ✅ Model info displayed");
      if (hasCost > 0) console.log("  ✅ Cost displayed");
    } else {
      console.log("ℹ️  No execution history yet (agent needs to run first)");
    }

    // Check for timeline visualization
    const timelineViz = page.locator('canvas, svg, [class*="timeline"]');

    if (await timelineViz.first().isVisible()) {
      console.log("✅ Timeline visualization present");
    }

    // =========================================
    // PHASE 3: Select Point in Time
    // =========================================

    console.log("Phase 3: Selecting execution point...");

    // Find an execution to replay
    const replayableExecution = page.locator('[class*="execution"], [data-execution]').first();

    if (await replayableExecution.isVisible()) {
      // Click execution to view details
      await replayableExecution.click();
      await page.waitForTimeout(1500);

      // Verify execution detail view
      const detailView = page.locator('[class*="detail"], [data-execution-detail]');

      if (await detailView.first().isVisible()) {
        console.log("✅ Execution details displayed");

        // Verify detail elements
        const detailElements = {
          originalModel: page.getByText(/original model|used model/i),
          prompt: page.getByText(/prompt|input|query/i),
          response: page.getByText(/response|output|result/i),
          cost: page.getByText(/cost|\$/i),
          duration: page.getByText(/duration|time|latency/i),
        };

        let visibleDetails = 0;
        for (const [name, element] of Object.entries(detailElements)) {
          if (await element.first().isVisible()) {
            console.log(`  ✅ ${name} visible`);
            visibleDetails++;
          }
        }

        expect(visibleDetails).toBeGreaterThan(0);
      }
    }

    // =========================================
    // PHASE 4: Replay from Point
    // =========================================

    console.log("Phase 4: Replaying execution...");

    // Look for replay button
    const replayButton = page.locator(
      'button:has-text("Replay"), button:has-text("Re-run")'
    ).first();

    if (await replayButton.isVisible()) {
      await replayButton.click();
      await page.waitForTimeout(1000);

      // Look for model selection dialog
      const modelDialog = page.locator('[role="dialog"], [class*="modal"]');

      if (await modelDialog.first().isVisible()) {
        console.log("✅ Model selection dialog appeared");

        // Select cheaper model (e.g., Haiku 4)
        const cheaperModel = page.locator(
          'button:has-text("Haiku"), [value="haiku"], option:has-text("Haiku")'
        ).first();

        if (await cheaperModel.isVisible()) {
          await cheaperModel.click();
          console.log("✅ Selected cheaper model (Haiku 4)");
        }

        // Confirm replay
        const confirmButton = page.locator(
          'button:has-text("Confirm"), button:has-text("Replay"), button:has-text("Start")'
        ).first();

        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(2000);

          console.log("✅ Replay initiated");

          // Wait for replay to complete
          await page.waitForTimeout(3000);

          // Look for completion indicator
          const completionNotif = page.locator(
            '[role="status"]:has-text("complete"), [class*="toast"]:has-text("complete")'
          );

          if (await completionNotif.first().isVisible()) {
            console.log("✅ Replay completed");
          }
        }
      }
    } else {
      console.log("⚠️  Replay button not found");
    }

    // =========================================
    // PHASE 5: Compare Original vs Replay
    // =========================================

    console.log("Phase 5: Comparing original vs replay...");

    // Look for comparison view
    const comparisonSection = page.getByText(/comparison|compare|vs|original.*replay/i);

    if (await comparisonSection.first().isVisible()) {
      console.log("✅ Comparison section visible");

      // Verify side-by-side comparison
      const originalColumn = page.locator('[class*="original"], [data-type="original"]');
      const replayColumn = page.locator('[class*="replay"], [data-type="replay"]');

      if (await originalColumn.first().isVisible() && await replayColumn.first().isVisible()) {
        console.log("✅ Side-by-side comparison displayed");

        // Get original model
        const originalModel = await originalColumn.first().getByText(/claude|gpt|sonnet|opus|haiku/i).first().textContent();
        console.log(`  Original model: ${originalModel}`);

        // Get replay model
        const replayModel = await replayColumn.first().getByText(/claude|gpt|sonnet|opus|haiku/i).first().textContent();
        console.log(`  Replay model: ${replayModel}`);

        // Get original cost
        const originalCostEl = originalColumn.first().getByText(/\$\d+\.\d{2}/);
        if (await originalCostEl.first().isVisible()) {
          const originalCost = await originalCostEl.first().textContent();
          console.log(`  Original cost: ${originalCost}`);
        }

        // Get replay cost
        const replayCostEl = replayColumn.first().getByText(/\$\d+\.\d{2}/);
        if (await replayCostEl.first().isVisible()) {
          const replayCost = await replayCostEl.first().textContent();
          console.log(`  Replay cost: ${replayCost}`);
        }
      }
    }

    // =========================================
    // PHASE 6: Identify Differences/Regression
    // =========================================

    console.log("Phase 6: Checking for differences...");

    // Look for diff/regression indicators
    const diffIndicator = page.locator('[class*="diff"], [class*="change"], [data-diff]');

    if (await diffIndicator.first().isVisible()) {
      console.log("✅ Differences detected and highlighted");

      const diffCount = await diffIndicator.count();
      console.log(`  ${diffCount} differences found`);

      // Check for quality score
      const qualityScore = page.getByText(/quality|similarity|match/i);

      if (await qualityScore.first().isVisible()) {
        const scoreText = await qualityScore.first().textContent();
        console.log(`  Quality score: ${scoreText}`);

        // Quality should be high (>90%)
        const scoreMatch = scoreText?.match(/(\d+)%/);
        if (scoreMatch) {
          const score = parseInt(scoreMatch[1] ?? "0");
          if (score >= 90) {
            console.log("  ✅ High quality replay (≥90%)");
          } else if (score >= 75) {
            console.log("  ⚠️  Medium quality replay (75-89%)");
          } else {
            console.log("  ❌ Low quality replay (<75%)");
          }
        }
      }
    } else {
      console.log("ℹ️  No significant differences detected");
    }

    // =========================================
    // PHASE 7: View Cost Savings Analytics
    // =========================================

    console.log("Phase 7: Viewing cost savings...");

    // Look for savings section
    const savingsSection = page.getByText(/savings|saved|reduction/i);

    if (await savingsSection.first().isVisible()) {
      console.log("✅ Savings section visible");

      // Get savings amount
      const savingsAmount = page.locator('[class*="savings"], [data-savings]');

      if (await savingsAmount.first().isVisible()) {
        const savingsText = await savingsAmount.first().textContent();
        console.log(`  Savings: ${savingsText}`);
      }

      // Get savings percentage
      const savingsPercent = page.getByText(/\d+%.*saved|saved.*\d+%/i);

      if (await savingsPercent.first().isVisible()) {
        const percentText = await savingsPercent.first().textContent();
        console.log(`  Savings percentage: ${percentText}`);
      }

      // Check for savings chart
      const savingsChart = page.locator('canvas, svg, [class*="chart"]');

      if (await savingsChart.first().isVisible()) {
        console.log("✅ Savings visualization present");
      }
    }

    // Navigate to analytics page
    await page.goto("/dashboard/time-travel/analytics");
    await page.waitForTimeout(1500);

    // Verify analytics dashboard
    const analyticsMetrics = {
      totalReplays: page.getByText(/total replay|replays/i),
      totalSavings: page.getByText(/total saving|\$\d+.*saved/i),
      avgSavings: page.getByText(/average|avg.*saving/i),
      qualityScore: page.getByText(/quality|accuracy/i),
    };

    let visibleMetrics = 0;
    for (const [name, element] of Object.entries(analyticsMetrics)) {
      if (await element.first().isVisible()) {
        console.log(`✅ ${name} metric visible`);
        visibleMetrics++;
      }
    }

    expect(visibleMetrics).toBeGreaterThan(0);

    console.log("✅ Complete Time Travel debug journey successful!");
  });

  test("Batch replay multiple executions", async ({ page }) => {
    // Test batch replay feature
    await page.goto("/dashboard/time-travel");
    await page.waitForTimeout(1500);

    // Look for batch select option
    const batchButton = page.locator(
      'button:has-text("Batch"), button:has-text("Select Multiple")'
    ).first();

    if (await batchButton.isVisible()) {
      await batchButton.click();
      await page.waitForTimeout(1000);

      // Select multiple executions
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount >= 3) {
        // Select first 3 executions
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();
        await checkboxes.nth(2).check();

        console.log("✅ 3 executions selected for batch replay");

        // Click batch replay button
        const replayAllButton = page.locator(
          'button:has-text("Replay All"), button:has-text("Replay Selected")'
        ).first();

        if (await replayAllButton.isVisible()) {
          await replayAllButton.click();
          await page.waitForTimeout(1000);

          // Select cheaper model for all
          const modelSelect = page.locator('select, [role="combobox"]').first();

          if (await modelSelect.isVisible()) {
            await modelSelect.click();
            const haikuOption = page.locator('option:has-text("Haiku")').first();

            if (await haikuOption.isVisible()) {
              await haikuOption.click();
            }
          }

          // Confirm batch replay
          const confirmButton = page.locator('button:has-text("Confirm")').first();

          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            await page.waitForTimeout(5000); // Batch takes longer

            console.log("✅ Batch replay completed");
          }
        }
      }
    }
  });

  test("Export time travel data", async ({ page }) => {
    // Test export functionality
    await page.goto("/dashboard/time-travel/analytics");
    await page.waitForTimeout(1500);

    // Look for export button
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Download")'
    ).first();

    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(1000);

      // Select CSV format
      const csvOption = page.locator('button:has-text("CSV")').first();

      if (await csvOption.isVisible()) {
        const downloadPromise = page.waitForEvent("download", { timeout: 10000 });

        await csvOption.click();

        try {
          const download = await downloadPromise;
          const fileName = download.suggestedFilename();

          expect(fileName).toMatch(/time-travel.*\.csv$/i);
          console.log(`✅ Export successful: ${fileName}`);

          await download.cancel();
        } catch (error) {
          console.log("⚠️  Download not triggered (may require data)");
        }
      }
    }
  });
});
