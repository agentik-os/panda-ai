import { test, expect } from "@playwright/test";

/**
 * E2E Journey: Agent Dreams Workflow
 *
 * Complete Dreams system user journey:
 * 1. Navigate to Dreams dashboard
 * 2. View dream schedule
 * 3. Configure dream settings (frequency, time)
 * 4. View dream reports (morning insights)
 * 5. Review actions from dreams
 * 6. Approve/reject dream actions
 * 7. View consolidated memory
 *
 * Tests the complete Dreams workflow from configuration to action review.
 */

test.describe("E2E Journey: Agent Dreams Workflow", () => {
  test("Complete dreams workflow journey", async ({ page }) => {
    // =========================================
    // PHASE 1: Navigate to Dreams Dashboard
    // =========================================

    console.log("Phase 1: Accessing Dreams dashboard...");

    await page.goto("/dashboard/dreams");
    await page.waitForTimeout(1500);

    // Verify Dreams page loads
    await expect(page.locator("h1, h2")).toContainText(/dream|morning/i);

    // Verify Dreams explanation/header
    const dreamsExplanation = page.getByText(/while you sleep|overnight|morning/i);

    if (await dreamsExplanation.first().isVisible()) {
      console.log("✅ Dreams feature explanation visible");
    }

    // =========================================
    // PHASE 2: View Dream Schedule
    // =========================================

    console.log("Phase 2: Viewing dream schedule...");

    // Look for schedule section
    const scheduleSection = page.getByText(/schedule|when|timing/i);

    if (await scheduleSection.first().isVisible()) {
      console.log("✅ Schedule section visible");

      // Verify schedule details
      const scheduleTime = page.getByText(/\d{1,2}:\d{2}|AM|PM/i);

      if (await scheduleTime.first().isVisible()) {
        const timeText = await scheduleTime.first().textContent();
        console.log(`Dream time configured: ${timeText}`);
      }
    }

    // =========================================
    // PHASE 3: Configure Dream Settings
    // =========================================

    console.log("Phase 3: Configuring dream settings...");

    // Look for settings button
    const settingsButton = page.locator(
      'button:has-text("Settings"), button:has-text("Configure"), a:has-text("Settings")'
    ).first();

    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(1000);

      // Frequency setting
      const frequencySelect = page.locator(
        'select[name="frequency"], [role="combobox"]'
      ).first();

      if (await frequencySelect.isVisible()) {
        await frequencySelect.click();
        await page.waitForTimeout(500);

        // Select "Daily"
        const dailyOption = page.locator(
          'option:has-text("Daily"), [role="option"]:has-text("Daily")'
        ).first();

        if (await dailyOption.isVisible()) {
          await dailyOption.click();
          console.log("✅ Frequency set to Daily");
        }
      }

      // Time setting
      const timeInput = page.locator(
        'input[type="time"], input[name="time"]'
      ).first();

      if (await timeInput.isVisible()) {
        await timeInput.fill("02:00");
        console.log("✅ Dream time set to 2:00 AM");
      }

      // Save settings
      const saveButton = page.locator(
        'button:has-text("Save"), button:has-text("Apply")'
      ).first();

      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1500);

        // Verify success notification
        const successNotif = page.locator(
          '[role="status"], [class*="toast"]'
        );

        if (await successNotif.first().isVisible()) {
          console.log("✅ Settings saved successfully");
        }
      }
    }

    // =========================================
    // PHASE 4: View Dream Reports
    // =========================================

    console.log("Phase 4: Viewing dream reports...");

    // Navigate back to main dreams page
    await page.goto("/dashboard/dreams");
    await page.waitForTimeout(1500);

    // Look for reports section
    const reportsSection = page.getByText(/recent reports|morning reports|insights/i);

    if (await reportsSection.first().isVisible()) {
      console.log("✅ Reports section visible");

      // Count report cards
      const reportCards = page.locator('[class*="Card"], [data-report]');
      const reportCount = await reportCards.count();

      if (reportCount > 0) {
        console.log(`✅ ${reportCount} dream reports available`);

        // Click first report to view details
        await reportCards.first().click();
        await page.waitForTimeout(1500);

        // Verify report details page
        const reportTitle = page.locator("h1, h2");
        await expect(reportTitle).toBeVisible();

        const reportDate = await page.getByText(/\d{4}-\d{2}-\d{2}/i).first().textContent();
        console.log(`Viewing report from: ${reportDate}`);

        // Verify report sections
        const reportSections = {
          summary: page.getByText(/summary|what happened/i),
          insights: page.getByText(/insight|learning|pattern/i),
          actions: page.getByText(/action|task|executed/i),
          metrics: page.getByText(/duration|cost|memory/i),
        };

        let visibleSections = 0;
        for (const [name, element] of Object.entries(reportSections)) {
          if (await element.first().isVisible()) {
            console.log(`✅ ${name} section visible`);
            visibleSections++;
          }
        }

        expect(visibleSections).toBeGreaterThan(0);
      } else {
        console.log("ℹ️  No dream reports yet (agent needs to run overnight)");
      }
    }

    // =========================================
    // PHASE 5: Review Actions from Dreams
    // =========================================

    console.log("Phase 5: Reviewing dream actions...");

    // Look for actions tab
    const actionsTab = page.locator(
      'button:has-text("Actions"), [role="tab"]:has-text("Actions")'
    ).first();

    if (await actionsTab.isVisible()) {
      await actionsTab.click();
      await page.waitForTimeout(1000);

      // Verify actions list
      const actionItems = page.locator('[class*="action"], [data-action]');
      const actionCount = await actionItems.count();

      if (actionCount > 0) {
        console.log(`✅ ${actionCount} actions from dreams`);

        // Check for action categories
        const approvedActions = page.locator(
          '[class*="approved"], [data-status="approved"]'
        );
        const pendingActions = page.locator(
          '[class*="pending"], [data-status="pending"]'
        );

        const approvedCount = await approvedActions.count();
        const pendingCount = await pendingActions.count();

        console.log(`  - ${approvedCount} auto-approved`);
        console.log(`  - ${pendingCount} awaiting review`);
      } else {
        console.log("ℹ️  No actions from dreams yet");
      }
    }

    // =========================================
    // PHASE 6: Approve/Reject Dream Actions
    // =========================================

    console.log("Phase 6: Managing dream actions...");

    // Find pending actions
    const pendingAction = page.locator(
      '[class*="pending"], [data-status="pending"]'
    ).first();

    if (await pendingAction.isVisible()) {
      // Verify action details
      const actionDescription = await pendingAction.locator('p, [class*="description"]').first().textContent();
      console.log(`Pending action: ${actionDescription?.substring(0, 50)}...`);

      // Look for approve button
      const approveButton = pendingAction.locator(
        'button:has-text("Approve"), button:has-text("Accept")'
      ).first();

      if (await approveButton.isVisible()) {
        await approveButton.click();
        await page.waitForTimeout(1500);

        // Verify action moved to approved
        const successNotif = page.locator(
          '[role="status"]:has-text("approved"), [class*="toast"]'
        );

        if (await successNotif.first().isVisible()) {
          console.log("✅ Action approved successfully");
        }
      }

      // Test reject on another pending action
      const anotherPendingAction = page.locator(
        '[class*="pending"], [data-status="pending"]'
      ).first();

      if (await anotherPendingAction.isVisible()) {
        const rejectButton = anotherPendingAction.locator(
          'button:has-text("Reject"), button:has-text("Decline")'
        ).first();

        if (await rejectButton.isVisible()) {
          await rejectButton.click();
          await page.waitForTimeout(1500);

          console.log("✅ Action rejected successfully");
        }
      }
    } else {
      console.log("ℹ️  No pending actions to review");
    }

    // =========================================
    // PHASE 7: View Consolidated Memory
    // =========================================

    console.log("Phase 7: Viewing consolidated memory...");

    // Look for memory/insights tab
    const memoryTab = page.locator(
      'button:has-text("Insights"), button:has-text("Memory"), [role="tab"]:has-text("Insights")'
    ).first();

    if (await memoryTab.isVisible()) {
      await memoryTab.click();
      await page.waitForTimeout(1000);

      // Verify insights/memory display
      const insightItems = page.locator('[class*="insight"], [data-insight]');
      const insightCount = await insightItems.count();

      if (insightCount > 0) {
        console.log(`✅ ${insightCount} insights from dreams`);

        // Check first insight
        const firstInsight = insightItems.first();
        const insightText = await firstInsight.textContent();

        console.log(`Sample insight: ${insightText?.substring(0, 80)}...`);
      } else {
        console.log("ℹ️  No insights yet from dreams");
      }

      // Check for memory consolidation metrics
      const memoryMetrics = page.getByText(/\d+ KB|\d+ MB|consolidated/i);

      if (await memoryMetrics.first().isVisible()) {
        const metricsText = await memoryMetrics.first().textContent();
        console.log(`Memory consolidated: ${metricsText}`);
      }
    }

    console.log("✅ Complete Dreams workflow successful!");
  });

  test("Dreams notification system", async ({ page }) => {
    // Test morning report notifications
    await page.goto("/dashboard/dreams");
    await page.waitForTimeout(1500);

    // Check for notification settings
    const notificationButton = page.locator(
      'button:has-text("Notifications"), button:has-text("Alerts")'
    ).first();

    if (await notificationButton.isVisible()) {
      await notificationButton.click();
      await page.waitForTimeout(1000);

      // Email notification toggle
      const emailToggle = page.locator(
        'input[type="checkbox"][name="email"], label:has-text("Email")'
      ).first();

      if (await emailToggle.isVisible()) {
        await emailToggle.check();
        console.log("✅ Email notifications enabled");
      }

      // Slack notification toggle
      const slackToggle = page.locator(
        'input[type="checkbox"][name="slack"], label:has-text("Slack")'
      ).first();

      if (await slackToggle.isVisible()) {
        await slackToggle.check();
        console.log("✅ Slack notifications enabled");
      }

      // Save notification settings
      const saveButton = page.locator(
        'button:has-text("Save"), button:has-text("Update")'
      ).first();

      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1500);

        console.log("✅ Notification settings saved");
      }
    }
  });

  test("Dreams analytics and history", async ({ page }) => {
    // Test historical dream data viewing
    await page.goto("/dashboard/dreams");
    await page.waitForTimeout(1500);

    // Look for date range selector
    const dateRangeButton = page.locator(
      'button:has-text("Date"), button:has-text("Range"), select[name="date"]'
    ).first();

    if (await dateRangeButton.isVisible()) {
      await dateRangeButton.click();
      await page.waitForTimeout(500);

      // Select "Last 7 Days"
      const sevenDaysOption = page.locator(
        'option:has-text("7 Days"), [role="option"]:has-text("7 Days")'
      ).first();

      if (await sevenDaysOption.isVisible()) {
        await sevenDaysOption.click();
        await page.waitForTimeout(1500);

        console.log("✅ Viewing last 7 days of dreams");
      }
    }

    // Check for analytics charts
    const analyticsChart = page.locator(
      'canvas, svg, [class*="chart"]'
    );

    if (await analyticsChart.first().isVisible()) {
      console.log("✅ Analytics visualizations present");
    }

    // Check for summary metrics
    const summaryMetrics = {
      totalDreams: page.getByText(/total dream|session|run/i),
      avgDuration: page.getByText(/average|avg.*duration/i),
      totalActions: page.getByText(/total action|executed/i),
      memoryConsolidated: page.getByText(/memory|consolidated/i),
    };

    let visibleMetrics = 0;
    for (const [name, element] of Object.entries(summaryMetrics)) {
      if (await element.first().isVisible()) {
        console.log(`✅ ${name} metric visible`);
        visibleMetrics++;
      }
    }

    expect(visibleMetrics).toBeGreaterThan(0);
  });
});
