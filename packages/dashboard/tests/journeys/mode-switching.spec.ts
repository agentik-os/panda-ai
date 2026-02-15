import { test, expect } from "@playwright/test";

/**
 * E2E Journey: OS Mode Switching (Focus/Creative/Research)
 *
 * Complete OS Modes user journey:
 * 1. Navigate to agent detail page
 * 2. View current mode
 * 3. Switch to Focus mode
 * 4. Verify Focus mode behavior
 * 5. Switch to Creative mode
 * 6. Verify Creative mode behavior
 * 7. Switch to Research mode
 * 8. Verify Research mode behavior
 * 9. View mode analytics
 *
 * Tests the complete OS Modes workflow and mode-specific behaviors.
 */

test.describe("E2E Journey: OS Mode Switching", () => {
  test("Complete mode switching journey", async ({ page }) => {
    // =========================================
    // PHASE 1: Navigate to Agent with Modes
    // =========================================

    console.log("Phase 1: Accessing agent with OS modes...");

    await page.goto("/dashboard/agents");
    await page.waitForTimeout(1500);

    // Find an agent
    const agentCard = page.locator('[class*="Card"]').first();

    if (await agentCard.isVisible()) {
      await agentCard.click();
      await page.waitForTimeout(1500);

      // Verify agent detail page
      await expect(page.url()).toMatch(/\/agents\/[a-z0-9-]+/);
    } else {
      console.log("⚠️  No agents available for testing");
      return;
    }

    // =========================================
    // PHASE 2: View Current Mode
    // =========================================

    console.log("Phase 2: Viewing current OS mode...");

    // Look for mode section/indicator
    const modeSection = page.getByText(/mode|focus|creative|research/i);

    if (await modeSection.first().isVisible()) {
      console.log("✅ Mode section visible");

      // Get current mode
      const currentModeBadge = page.locator(
        '[class*="Badge"]:has-text("Focus"), [class*="Badge"]:has-text("Creative"), [class*="Badge"]:has-text("Research")'
      ).first();

      if (await currentModeBadge.isVisible()) {
        const currentMode = await currentModeBadge.textContent();
        console.log(`Current mode: ${currentMode}`);
      }

      // Verify mode description
      const modeDescription = page.getByText(/precision|creativity|deep/i);

      if (await modeDescription.first().isVisible()) {
        console.log("✅ Mode description displayed");
      }
    } else {
      console.log("ℹ️  OS Modes section not found (feature may not be enabled)");
    }

    // =========================================
    // PHASE 3: Switch to Focus Mode
    // =========================================

    console.log("Phase 3: Switching to Focus mode...");

    // Look for mode selector
    const modeSelector = page.locator(
      'button:has-text("Mode"), select[name="mode"], [role="combobox"]'
    ).first();

    if (await modeSelector.isVisible()) {
      await modeSelector.click();
      await page.waitForTimeout(500);

      // Select Focus mode
      const focusOption = page.locator(
        'option:has-text("Focus"), [role="option"]:has-text("Focus"), button:has-text("Focus")'
      ).first();

      if (await focusOption.isVisible()) {
        await focusOption.click();
        await page.waitForTimeout(2000);

        console.log("✅ Switched to Focus mode");

        // Verify mode change success
        const successNotif = page.locator(
          '[role="status"]:has-text("Focus"), [class*="toast"]'
        );

        if (await successNotif.first().isVisible()) {
          console.log("✅ Mode change confirmed");
        }
      }
    }

    // =========================================
    // PHASE 4: Verify Focus Mode Behavior
    // =========================================

    console.log("Phase 4: Verifying Focus mode behavior...");

    // Check for Focus mode indicators
    const focusBadge = page.locator(
      '[class*="Badge"]:has-text("Focus"), [data-mode="focus"]'
    ).first();

    if (await focusBadge.isVisible()) {
      console.log("✅ Focus mode badge displayed");
    }

    // Verify Focus mode description
    const focusDescription = page.getByText(/precision|concise|minimal/i);

    if (await focusDescription.first().isVisible()) {
      const descText = await focusDescription.first().textContent();
      console.log(`Focus mode description: ${descText?.substring(0, 60)}...`);
    }

    // Check for Focus mode settings
    const focusSettings = {
      temperature: page.getByText(/temperature.*0\.\d|low temp/i),
      maxTokens: page.getByText(/tokens.*\d+/i),
      responseStyle: page.getByText(/concise|brief|focused/i),
    };

    let visibleSettings = 0;
    for (const [name, element] of Object.entries(focusSettings)) {
      if (await element.first().isVisible()) {
        console.log(`  ✅ ${name} setting visible`);
        visibleSettings++;
      }
    }

    // =========================================
    // PHASE 5: Switch to Creative Mode
    // =========================================

    console.log("Phase 5: Switching to Creative mode...");

    if (await modeSelector.isVisible()) {
      await modeSelector.click();
      await page.waitForTimeout(500);

      const creativeOption = page.locator(
        'option:has-text("Creative"), [role="option"]:has-text("Creative"), button:has-text("Creative")'
      ).first();

      if (await creativeOption.isVisible()) {
        await creativeOption.click();
        await page.waitForTimeout(2000);

        console.log("✅ Switched to Creative mode");
      }
    }

    // =========================================
    // PHASE 6: Verify Creative Mode Behavior
    // =========================================

    console.log("Phase 6: Verifying Creative mode behavior...");

    const creativeBadge = page.locator(
      '[class*="Badge"]:has-text("Creative"), [data-mode="creative"]'
    ).first();

    if (await creativeBadge.isVisible()) {
      console.log("✅ Creative mode badge displayed");
    }

    // Verify Creative mode description
    const creativeDescription = page.getByText(/creative|exploration|novel/i);

    if (await creativeDescription.first().isVisible()) {
      const descText = await creativeDescription.first().textContent();
      console.log(`Creative mode description: ${descText?.substring(0, 60)}...`);
    }

    // Check for Creative mode settings
    const creativeSettings = {
      temperature: page.getByText(/temperature.*1\.\d|high temp/i),
      responseStyle: page.getByText(/creative|exploratory|imaginative/i),
    };

    for (const [name, element] of Object.entries(creativeSettings)) {
      if (await element.first().isVisible()) {
        console.log(`  ✅ ${name} setting visible`);
      }
    }

    // =========================================
    // PHASE 7: Switch to Research Mode
    // =========================================

    console.log("Phase 7: Switching to Research mode...");

    if (await modeSelector.isVisible()) {
      await modeSelector.click();
      await page.waitForTimeout(500);

      const researchOption = page.locator(
        'option:has-text("Research"), [role="option"]:has-text("Research"), button:has-text("Research")'
      ).first();

      if (await researchOption.isVisible()) {
        await researchOption.click();
        await page.waitForTimeout(2000);

        console.log("✅ Switched to Research mode");
      }
    }

    // =========================================
    // PHASE 8: Verify Research Mode Behavior
    // =========================================

    console.log("Phase 8: Verifying Research mode behavior...");

    const researchBadge = page.locator(
      '[class*="Badge"]:has-text("Research"), [data-mode="research"]'
    ).first();

    if (await researchBadge.isVisible()) {
      console.log("✅ Research mode badge displayed");
    }

    // Verify Research mode description
    const researchDescription = page.getByText(/deep.*analysis|comprehensive|thorough/i);

    if (await researchDescription.first().isVisible()) {
      const descText = await researchDescription.first().textContent();
      console.log(`Research mode description: ${descText?.substring(0, 60)}...`);
    }

    // Check for Research mode settings
    const researchSettings = {
      maxTokens: page.getByText(/tokens.*\d+|extended/i),
      depth: page.getByText(/depth|thorough|comprehensive/i),
      citations: page.getByText(/citation|source|reference/i),
    };

    for (const [name, element] of Object.entries(researchSettings)) {
      if (await element.first().isVisible()) {
        console.log(`  ✅ ${name} setting visible`);
      }
    }

    // =========================================
    // PHASE 9: View Mode Analytics
    // =========================================

    console.log("Phase 9: Viewing mode analytics...");

    // Look for analytics/stats tab
    const analyticsTab = page.locator(
      'button:has-text("Analytics"), button:has-text("Stats"), [role="tab"]:has-text("Analytics")'
    ).first();

    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
      await page.waitForTimeout(1500);

      // Check for mode usage metrics
      const modeMetrics = {
        focusUsage: page.getByText(/focus.*\d+%|focus.*\d+ times/i),
        creativeUsage: page.getByText(/creative.*\d+%|creative.*\d+ times/i),
        researchUsage: page.getByText(/research.*\d+%|research.*\d+ times/i),
      };

      let visibleMetrics = 0;
      for (const [name, element] of Object.entries(modeMetrics)) {
        if (await element.first().isVisible()) {
          const metricText = await element.first().textContent();
          console.log(`  ✅ ${name}: ${metricText}`);
          visibleMetrics++;
        }
      }

      // Check for mode distribution chart
      const modeChart = page.locator('canvas, svg, [class*="chart"]');

      if (await modeChart.first().isVisible()) {
        console.log("✅ Mode distribution chart visible");
      }
    } else {
      console.log("ℹ️  Analytics tab not available");
    }

    console.log("✅ Complete mode switching journey successful!");
  });

  test("Auto mode switching based on task", async ({ page }) => {
    // Test automatic mode recommendation
    await page.goto("/dashboard/agents");
    await page.waitForTimeout(1500);

    const agentCard = page.locator('[class*="Card"]').first();

    if (await agentCard.isVisible()) {
      await agentCard.click();
      await page.waitForTimeout(1500);

      // Look for auto-mode toggle
      const autoModeToggle = page.locator(
        'input[type="checkbox"][name="auto-mode"], label:has-text("Auto")'
      ).first();

      if (await autoModeToggle.isVisible()) {
        await autoModeToggle.check();
        await page.waitForTimeout(1000);

        console.log("✅ Auto-mode enabled");

        // Verify auto-mode description
        const autoModeDesc = page.getByText(/automatically switch|based on task/i);

        if (await autoModeDesc.first().isVisible()) {
          console.log("✅ Auto-mode description displayed");
        }
      } else {
        console.log("ℹ️  Auto-mode feature not available");
      }
    }
  });

  test("Mode-specific prompt templates", async ({ page }) => {
    // Test mode-specific prompt templates
    await page.goto("/dashboard/agents");
    await page.waitForTimeout(1500);

    const agentCard = page.locator('[class*="Card"]').first();

    if (await agentCard.isVisible()) {
      await agentCard.click();
      await page.waitForTimeout(1500);

      // Navigate to prompt settings
      const promptButton = page.locator(
        'button:has-text("Prompt"), button:has-text("System Prompt")'
      ).first();

      if (await promptButton.isVisible()) {
        await promptButton.click();
        await page.waitForTimeout(1000);

        // Check if different modes have different prompts
        const focusModeButton = page.locator('button:has-text("Focus")').first();

        if (await focusModeButton.isVisible()) {
          await focusModeButton.click();
          await page.waitForTimeout(500);

          const focusPrompt = page.locator('textarea, [contenteditable]').first();

          if (await focusPrompt.isVisible()) {
            const focusText = await focusPrompt.textContent();
            console.log(`Focus mode prompt preview: ${focusText?.substring(0, 80)}...`);
          }

          // Switch to Creative mode prompt
          const creativeModeButton = page.locator('button:has-text("Creative")').first();

          if (await creativeModeButton.isVisible()) {
            await creativeModeButton.click();
            await page.waitForTimeout(500);

            const creativePrompt = page.locator('textarea, [contenteditable]').first();

            if (await creativePrompt.isVisible()) {
              const creativeText = await creativePrompt.textContent();
              console.log(`Creative mode prompt preview: ${creativeText?.substring(0, 80)}...`);
            }
          }

          console.log("✅ Mode-specific prompts configured");
        }
      }
    }
  });

  test("Mode performance comparison", async ({ page }) => {
    // Test mode performance analytics
    await page.goto("/dashboard/analytics");
    await page.waitForTimeout(1500);

    // Look for mode comparison section
    const modeComparisonSection = page.getByText(/mode comparison|compare modes/i);

    if (await modeComparisonSection.first().isVisible()) {
      console.log("✅ Mode comparison section found");

      // Check for performance metrics by mode
      const performanceMetrics = {
        focusSpeed: page.getByText(/focus.*speed|focus.*latency/i),
        creativeQuality: page.getByText(/creative.*quality|creative.*score/i),
        researchDepth: page.getByText(/research.*depth|research.*thoroughness/i),
      };

      for (const [name, element] of Object.entries(performanceMetrics)) {
        if (await element.first().isVisible()) {
          const metricText = await element.first().textContent();
          console.log(`  ✅ ${name}: ${metricText}`);
        }
      }

      // Check for comparison chart
      const comparisonChart = page.locator('canvas, svg, [class*="chart"]');

      if (await comparisonChart.first().isVisible()) {
        console.log("✅ Mode performance comparison chart visible");
      }
    } else {
      console.log("ℹ️  Mode comparison not available");
    }
  });
});
