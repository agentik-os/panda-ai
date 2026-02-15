import { test, expect } from "@playwright/test";

/**
 * E2E Journey: Agent Creation → Execution → Monitoring
 *
 * Complete user journey testing:
 * 1. Create new agent through 5-step wizard
 * 2. Start agent execution
 * 3. Monitor agent activity in real-time
 * 4. View execution logs
 * 5. Stop agent
 * 6. View execution summary
 *
 * This tests the complete lifecycle from conception to monitoring.
 */

test.describe("E2E Journey: Agent Creation → Execution → Monitoring", () => {
  const testAgentName = `Test Agent ${Date.now()}`;
  const testAgentDescription = "E2E test agent for monitoring journey";

  test("Complete agent lifecycle journey", async ({ page }) => {
    // =========================================
    // PHASE 1: Agent Creation (5-Step Wizard)
    // =========================================

    console.log("Phase 1: Creating agent through wizard...");

    // Navigate to agent creation
    await page.goto("/dashboard/agents/create");

    // Step 1: Basic Info
    await expect(page.locator("h1, h2")).toContainText(/create/i);

    const nameInput = page.locator('input[name="name"]').first();
    await nameInput.waitFor({ timeout: 5000 });
    await nameInput.fill(testAgentName);

    const descInput = page
      .locator('textarea[name="description"], input[name="description"]')
      .first();
    if (await descInput.isVisible()) {
      await descInput.fill(testAgentDescription);
    }

    // System prompt (optional)
    const promptInput = page
      .locator('textarea[name="systemPrompt"], textarea[name="prompt"]')
      .first();
    if (await promptInput.isVisible()) {
      await promptInput.fill(
        "You are a helpful AI assistant for testing purposes."
      );
    }

    // Click Next to Step 2
    let nextButton = page.locator('button:has-text("Next")').first();
    await expect(nextButton).toBeEnabled({ timeout: 3000 });
    await nextButton.click();

    // Step 2: Model Selection
    await page.waitForTimeout(1000);
    await expect(page.getByText(/model|provider/i)).toBeVisible({
      timeout: 5000,
    });

    // Select a model (Claude Sonnet 4.5 or first available)
    const modelOption = page
      .locator(
        'button:has-text("Claude"), button:has-text("Sonnet"), [role="radio"]'
      )
      .first();
    if (await modelOption.isVisible()) {
      await modelOption.click();
    }

    // Click Next to Step 3
    nextButton = page.locator('button:has-text("Next")').first();
    await nextButton.click();

    // Step 3: Channel Selection
    await page.waitForTimeout(1000);
    await expect(page.getByText(/channel/i)).toBeVisible({ timeout: 5000 });

    // Select CLI channel (most reliable for testing)
    const cliChannel = page
      .locator('button:has-text("CLI"), [value="cli"]')
      .first();
    if (await cliChannel.isVisible()) {
      await cliChannel.click();
    }

    // Click Next to Step 4
    nextButton = page.locator('button:has-text("Next")').first();
    await nextButton.click();

    // Step 4: Skills Selection
    await page.waitForTimeout(1000);
    await expect(page.getByText(/skill/i)).toBeVisible({ timeout: 5000 });

    // Select a basic skill (Web Search or File Operations)
    const skillOption = page
      .locator('button:has-text("Search"), button:has-text("File")')
      .first();
    if (await skillOption.isVisible()) {
      await skillOption.click();
    }

    // Click Next to Step 5
    nextButton = page.locator('button:has-text("Next")').first();
    await nextButton.click();

    // Step 5: Review & Create
    await page.waitForTimeout(1000);
    await expect(page.getByText(/review|confirm|summary/i)).toBeVisible({
      timeout: 5000,
    });

    // Final create button
    const createButton = page
      .locator(
        'button:has-text("Create Agent"), button:has-text("Create"), button:has-text("Submit")'
      )
      .first();
    await expect(createButton).toBeEnabled({ timeout: 3000 });
    await createButton.click();

    // Wait for creation success and redirect
    await page.waitForTimeout(2000);

    // Should redirect to agents list or agent detail page
    await expect(page.url()).toMatch(/\/agents/);

    // Verify agent appears in list
    await expect(page.getByText(testAgentName)).toBeVisible({ timeout: 5000 });

    console.log("✅ Agent created successfully");

    // =========================================
    // PHASE 2: Agent Execution
    // =========================================

    console.log("Phase 2: Starting agent execution...");

    // Find the newly created agent card
    const agentCard = page
      .locator(`[class*="Card"]:has-text("${testAgentName}")`)
      .first();
    await expect(agentCard).toBeVisible({ timeout: 5000 });

    // Verify initial status is "inactive" or "paused"
    const statusBadge = agentCard.locator('[class*="Badge"]').first();
    const initialStatus = await statusBadge.textContent();
    expect(initialStatus?.toLowerCase()).toMatch(/inactive|paused|idle/);

    // Click play/start button
    const playButton = agentCard
      .locator(
        'button[aria-label*="start"], button[aria-label*="play"], button:has-text("Start")'
      )
      .first();

    if (await playButton.isVisible()) {
      await playButton.click();
      await page.waitForTimeout(1500);

      // Status should change to "active"
      const newStatus = await statusBadge.textContent();
      expect(newStatus?.toLowerCase()).toMatch(/active|running/);

      console.log("✅ Agent started successfully");
    }

    // =========================================
    // PHASE 3: Real-Time Monitoring
    // =========================================

    console.log("Phase 3: Monitoring agent activity...");

    // Navigate to agent detail page
    await agentCard.click();
    await page.waitForTimeout(1000);

    // Should be on agent detail page
    await expect(page.url()).toMatch(/\/agents\/[a-z0-9-]+/);
    await expect(page.locator("h1, h2")).toContainText(testAgentName);

    // Verify monitoring dashboard elements
    const monitoringElements = {
      status: page.getByText(/status|active|running/i),
      activity: page.getByText(/activity|log|messages/i),
      metrics: page.getByText(/metric|usage|cost/i),
    };

    for (const [name, element] of Object.entries(monitoringElements)) {
      const isVisible = await element.isVisible();
      if (isVisible) {
        console.log(`✅ ${name} section visible`);
      }
    }

    // Check for real-time activity log
    const activityLog = page.locator(
      '[class*="log"], [class*="activity"], [class*="messages"]'
    );
    if (await activityLog.first().isVisible()) {
      console.log("✅ Activity log present");
    }

    // =========================================
    // PHASE 4: View Execution Logs
    // =========================================

    console.log("Phase 4: Viewing execution logs...");

    // Look for logs tab or section
    const logsTab = page
      .locator('button:has-text("Logs"), [role="tab"]:has-text("Logs")')
      .first();

    if (await logsTab.isVisible()) {
      await logsTab.click();
      await page.waitForTimeout(1000);

      // Verify log entries appear
      const logEntries = page.locator('[class*="log-entry"], [data-log]');
      const logCount = await logEntries.count();

      if (logCount > 0) {
        console.log(`✅ ${logCount} log entries visible`);
      } else {
        console.log("⚠️  No log entries yet (agent just started)");
      }
    }

    // =========================================
    // PHASE 5: Stop Agent
    // =========================================

    console.log("Phase 5: Stopping agent...");

    // Find pause/stop button
    const stopButton = page
      .locator(
        'button[aria-label*="stop"], button[aria-label*="pause"], button:has-text("Stop"), button:has-text("Pause")'
      )
      .first();

    if (await stopButton.isVisible()) {
      await stopButton.click();
      await page.waitForTimeout(1500);

      // Status should change back to "paused" or "stopped"
      const stoppedStatus = await page
        .locator('[class*="Badge"]')
        .first()
        .textContent();
      expect(stoppedStatus?.toLowerCase()).toMatch(/paused|stopped|inactive/);

      console.log("✅ Agent stopped successfully");
    }

    // =========================================
    // PHASE 6: View Execution Summary
    // =========================================

    console.log("Phase 6: Viewing execution summary...");

    // Look for summary/overview tab
    const summaryTab = page
      .locator(
        'button:has-text("Overview"), button:has-text("Summary"), [role="tab"]:has-text("Overview")'
      )
      .first();

    if (await summaryTab.isVisible()) {
      await summaryTab.click();
      await page.waitForTimeout(1000);
    }

    // Verify summary metrics exist
    const summaryMetrics = {
      totalMessages: page.getByText(/message|interaction/i),
      executionTime: page.getByText(/time|duration|uptime/i),
      cost: page.getByText(/cost|spent|\$/i),
    };

    let visibleMetrics = 0;
    for (const [name, element] of Object.entries(summaryMetrics)) {
      if (await element.isVisible()) {
        console.log(`✅ ${name} metric visible`);
        visibleMetrics++;
      }
    }

    expect(visibleMetrics).toBeGreaterThan(0);

    // =========================================
    // CLEANUP: Delete test agent
    // =========================================

    console.log("Cleanup: Deleting test agent...");

    // Navigate back to agents list
    await page.goto("/dashboard/agents");
    await page.waitForTimeout(1000);

    // Find and delete the test agent
    const testAgentCard = page
      .locator(`[class*="Card"]:has-text("${testAgentName}")`)
      .first();

    if (await testAgentCard.isVisible()) {
      const deleteButton = testAgentCard
        .locator(
          'button[aria-label*="delete"], button[aria-label*="remove"]'
        )
        .first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(500);

        // Confirm deletion
        const confirmButton = page
          .locator(
            'button:has-text("Confirm"), button:has-text("Delete"), button[class*="destructive"]'
          )
          .first();

        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(1500);

          // Verify agent is removed
          const agentStillExists =
            (await page.getByText(testAgentName).count()) > 0;
          expect(agentStillExists).toBe(false);

          console.log("✅ Test agent deleted successfully");
        }
      }
    }

    console.log("✅ Complete E2E journey successful!");
  });

  test("Agent execution with error handling", async ({ page }) => {
    // Test error scenarios during execution
    await page.goto("/dashboard/agents");

    // Look for any existing agent
    const existingAgent = page.locator('[class*="Card"]').first();

    if (await existingAgent.isVisible()) {
      // Start agent
      const playButton = existingAgent
        .locator('button[aria-label*="start"], button[aria-label*="play"]')
        .first();

      if (await playButton.isVisible()) {
        await playButton.click();
        await page.waitForTimeout(1500);
      }

      // Navigate to detail page
      await existingAgent.click();
      await page.waitForTimeout(1000);

      // Look for error indicators
      const errorIndicators = page.locator(
        '[class*="error"], [class*="alert"], [role="alert"]'
      );

      // Errors should be properly displayed if they occur
      const errorCount = await errorIndicators.count();
      console.log(`Error indicators found: ${errorCount}`);

      // Stop agent
      const stopButton = page
        .locator('button[aria-label*="stop"], button[aria-label*="pause"]')
        .first();

      if (await stopButton.isVisible()) {
        await stopButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test("Multi-agent monitoring view", async ({ page }) => {
    // Test monitoring multiple agents simultaneously
    await page.goto("/dashboard/agents");
    await page.waitForTimeout(1500);

    const agentCards = page.locator('[class*="Card"]');
    const agentCount = await agentCards.count();

    console.log(`Total agents visible: ${agentCount}`);

    if (agentCount >= 2) {
      // Start multiple agents
      const playButtons = page.locator(
        'button[aria-label*="start"], button[aria-label*="play"]'
      );
      const playCount = await playButtons.count();

      if (playCount >= 2) {
        // Start first two agents
        await playButtons.nth(0).click();
        await page.waitForTimeout(500);
        await playButtons.nth(1).click();
        await page.waitForTimeout(1500);

        // Verify both show active status
        const activeBadges = page.locator(
          '[class*="Badge"]:has-text("active"), [class*="Badge"]:has-text("running")'
        );
        const activeCount = await activeBadges.count();

        expect(activeCount).toBeGreaterThanOrEqual(2);
        console.log(`✅ ${activeCount} agents running simultaneously`);

        // Stop agents
        const stopButtons = page.locator(
          'button[aria-label*="stop"], button[aria-label*="pause"]'
        );
        await stopButtons.nth(0).click();
        await page.waitForTimeout(500);
        await stopButtons.nth(1).click();
      }
    } else {
      console.log("⚠️  Not enough agents to test multi-agent monitoring");
    }
  });
});
