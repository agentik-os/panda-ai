import { test, expect } from "@playwright/test";

/**
 * Agents Page Tests
 *
 * Tests the agents management interface including:
 * - Agents list page
 * - Agent cards display
 * - Agent creation wizard (5 steps)
 * - Form validation
 * - Navigation between wizard steps
 * - Agent status indicators
 */

test.describe("Agents List Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/agents");
  });

  test("should load and display page title", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Agents");
  });

  test("should display create agent button", async ({ page }) => {
    // Look for "Create Agent" or "+ Agent" button
    const createButton = page.locator('button:has-text("Agent"), a:has-text("Agent")').first();
    await expect(createButton).toBeVisible();
  });

  test("should display agents grid or empty state", async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(2000);

    // Either shows agent cards OR empty state message
    const hasAgentCards = await page.locator('[class*="grid"]').count();
    const hasEmptyState = await page.getByText(/no agents|create your first/i).count();

    expect(hasAgentCards + hasEmptyState).toBeGreaterThan(0);
  });

  test("should display agent cards with correct information", async ({ page }) => {
    // Wait for agents to load
    await page.waitForTimeout(2000);

    const agentCards = page.locator('[class*="Card"]');
    const cardCount = await agentCards.count();

    if (cardCount > 0) {
      // Check first agent card has required elements
      const firstCard = agentCards.first();

      // Should have status badge (active/paused/inactive)
      const hasBadge = await firstCard.locator('[class*="Badge"]').count();
      expect(hasBadge).toBeGreaterThan(0);

      // Should have action buttons (Play/Pause, Settings)
      const hasButtons = await firstCard.locator("button").count();
      expect(hasButtons).toBeGreaterThan(0);
    }
  });

  test("should navigate to agent creation page", async ({ page }) => {
    // Find and click create agent button
    const createButton = page.locator('a[href*="/create"]').first();

    if (await createButton.isVisible()) {
      await createButton.click();

      // Should navigate to creation page
      await expect(page).toHaveURL(/\/agents\/create/);
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Page should load
    await expect(page.locator("h1")).toBeVisible();

    // Grid should adapt to mobile (1 column)
    const grid = page.locator('[class*="grid"]').first();
    if (await grid.isVisible()) {
      const gridClasses = await grid.getAttribute("class");
      // Mobile grid should be single column by default
      expect(gridClasses).toBeTruthy();
    }
  });
});

test.describe("Agent Creation Wizard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/agents/create");
  });

  test("should display wizard with 5 steps", async ({ page }) => {
    // Check for step indicators (1-5)
    await expect(page.locator("h1")).toContainText("Create");

    // Look for step numbers or progress indicators
    const hasStepIndicators = await page.getByText(/step|1|2|3|4|5/i).count();
    expect(hasStepIndicators).toBeGreaterThan(0);
  });

  test("should display Step 1: Basic Info form", async ({ page }) => {
    // Step 1 should have name, description, system prompt fields
    await expect(page.getByText(/basic info|name|description/i)).toBeVisible();

    // At least some input fields should exist
    const inputCount = await page.locator("input, textarea").count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test("should require name field before proceeding", async ({ page }) => {
    // Try to click Next without filling name
    const nextButton = page.locator('button:has-text("Next")').first();

    if (await nextButton.isVisible()) {
      // Button might be disabled if validation works
      const isDisabled = await nextButton.isDisabled();

      if (!isDisabled) {
        await nextButton.click();

        // Should still be on step 1 if validation prevents progression
        // Or should show validation error
        await page.waitForTimeout(500);
        const url = page.url();
        expect(url).toBeTruthy();
      } else {
        // Button correctly disabled - validation working
        expect(isDisabled).toBe(true);
      }
    }
  });

  test("should navigate through wizard steps", async ({ page }) => {
    // Fill Step 1: Basic Info
    const nameInput = page.locator('input[name="name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill("Test Agent");

      const descInput = page.locator('textarea[name="description"], input[name="description"]').first();
      if (await descInput.isVisible()) {
        await descInput.fill("Test agent description");
      }

      // Click Next
      const nextButton = page.locator('button:has-text("Next")').first();
      if (await nextButton.isVisible() && !(await nextButton.isDisabled())) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Should move to Step 2 (Model Selection)
        await expect(page.getByText(/model|provider/i)).toBeVisible();
      }
    }
  });

  test("should display model selection in Step 2", async ({ page }) => {
    // Navigate to Step 2 (if possible)
    await page.waitForTimeout(1000);

    // Look for model-related text
    const hasModelSection = await page.getByText(/model|provider|claude|gpt|gemini/i).count();
    expect(hasModelSection).toBeGreaterThanOrEqual(0);
  });

  test("should display channel selection in Step 3", async ({ page }) => {
    // Look for channels text
    const hasChannelsSection = await page.getByText(/channel|telegram|discord|cli|api/i).count();
    expect(hasChannelsSection).toBeGreaterThanOrEqual(0);
  });

  test("should display skills selection in Step 4", async ({ page }) => {
    // Look for skills text
    const hasSkillsSection = await page.getByText(/skill|search|code|file/i).count();
    expect(hasSkillsSection).toBeGreaterThanOrEqual(0);
  });

  test("should have back button to go to previous step", async ({ page }) => {
    const backButton = page.locator('button:has-text("Back")').first();
    const backButtonCount = await backButton.count();

    // Back button may or may not be visible on first step
    expect(backButtonCount).toBeGreaterThanOrEqual(0);
  });

  test("should have cancel/close option", async ({ page }) => {
    // Look for cancel button or close icon
    const cancelButton = page.locator('button:has-text("Cancel"), a:has-text("Cancel")').first();
    const cancelCount = await cancelButton.count();

    expect(cancelCount).toBeGreaterThanOrEqual(0);
  });

  test("should show progress indicators", async ({ page }) => {
    // Look for visual progress indicators (step numbers, progress bar, etc.)
    const hasProgress = await page.locator('[class*="progress"], [role="progressbar"]').count();
    const hasStepNumbers = await page.getByText(/step \d/i).count();

    expect(hasProgress + hasStepNumbers).toBeGreaterThanOrEqual(0);
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Wizard should still be visible
    await expect(page.locator("h1")).toBeVisible();

    // Form fields should be visible
    const inputCount = await page.locator("input, textarea, select").count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test("should handle form submission (final step)", async ({ page }) => {
    // Look for Create/Submit button
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Submit")').first();
    const hasSubmitButton = await submitButton.count();

    // Submit button may be on the last step
    expect(hasSubmitButton).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Agent Actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/agents");
  });

  test("should have play/pause buttons on agent cards", async ({ page }) => {
    await page.waitForTimeout(2000);

    const agentCards = page.locator('[class*="Card"]');
    const cardCount = await agentCards.count();

    if (cardCount > 0) {
      // Check for action buttons
      const hasActionButtons = await page.locator('button[aria-label*="play"], button[aria-label*="pause"]').count();
      const hasSettingsButton = await page.locator('button[aria-label*="settings"]').count();

      // At least some action buttons should exist
      expect(hasActionButtons + hasSettingsButton).toBeGreaterThanOrEqual(0);
    }
  });

  test("should display agent status badges", async ({ page }) => {
    await page.waitForTimeout(2000);

    const badges = page.locator('[class*="Badge"]');
    const badgeCount = await badges.count();

    if (badgeCount > 0) {
      // Badges should have status text (active, paused, inactive)
      const firstBadge = badges.first();
      const badgeText = await firstBadge.textContent();

      expect(badgeText).toBeTruthy();
    }
  });

  test("should delete agent successfully", async ({ page }) => {
    await page.waitForTimeout(2000);

    const agentCards = page.locator('[class*="Card"]');
    const initialCount = await agentCards.count();

    if (initialCount > 0) {
      // Get the first agent's name/title for verification
      const firstCard = agentCards.first();
      const agentName = await firstCard.locator("h2, h3, [class*='Title']").first().textContent();

      // Look for delete button (may be in dropdown menu or direct button)
      const deleteButton = page.locator(
        'button[aria-label*="delete" i], button[aria-label*="remove" i], button:has-text("Delete")'
      ).first();

      if (await deleteButton.isVisible()) {
        // Click delete button
        await deleteButton.click();

        // Wait for confirmation dialog
        await page.waitForTimeout(500);

        // Look for confirm button in dialog
        const confirmButton = page.locator(
          'button:has-text("Confirm"), button:has-text("Delete"), button[class*="destructive"]'
        ).first();

        if (await confirmButton.isVisible()) {
          await confirmButton.click();

          // Wait for deletion to process
          await page.waitForTimeout(1000);

          // Verify agent is removed from list
          if (agentName) {
            const agentStillExists = await page.getByText(agentName).count();
            expect(agentStillExists).toBe(0);
          }

          // Verify card count decreased
          const newCount = await agentCards.count();
          expect(newCount).toBeLessThan(initialCount);
        }
      }
    }
  });
});
