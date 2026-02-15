import { test, expect } from "@playwright/test";

/**
 * E2E Journey: Error Recovery
 *
 * Tests graceful error handling and recovery across the platform:
 * 1. Network failures and retries
 * 2. API errors and fallbacks
 * 3. Agent execution failures
 * 4. State corruption recovery
 * 5. Session recovery after errors
 * 6. Partial data recovery
 *
 * Target: Validate system resilience and user-friendly error handling
 */

test.describe("Error Recovery", () => {
  test.describe("Network Failures", () => {
    test("should retry failed requests automatically", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Simulate network offline
      await page.context().setOffline(true);

      // Try to create agent (should queue request)
      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "offline-agent");
      await page.click('button[type="submit"]');

      // Should show pending/retry indicator
      await expect(page.locator('[data-testid="retry-indicator"]')).toBeVisible();

      // Restore network
      await page.context().setOffline(false);

      // Request should auto-retry and succeed
      await expect(page.locator('text=offline-agent')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test("should handle intermittent connection issues", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Create agent with flaky connection
      let requestCount = 0;
      await page.route("**/api/agents", (route) => {
        requestCount++;
        if (requestCount <= 2) {
          // Fail first 2 attempts
          route.abort("failed");
        } else {
          // Succeed on 3rd attempt
          route.continue();
        }
      });

      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "flaky-agent");
      await page.click('button[type="submit"]');

      // Should retry and eventually succeed
      await expect(page.locator('text=flaky-agent')).toBeVisible({ timeout: 15000 });
      expect(requestCount).toBeGreaterThanOrEqual(3);
    });

    test("should show user-friendly error after max retries", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Fail all requests
      await page.route("**/api/agents", (route) => route.abort("failed"));

      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "failed-agent");
      await page.click('button[type="submit"]');

      // Should show error message after retries exhausted
      await expect(
        page.locator('text=Network error, text=Connection failed, text=Try again')
      ).toBeVisible({ timeout: 20000 });

      // Should offer retry button
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    });
  });

  test.describe("API Errors", () => {
    test("should handle 500 errors gracefully", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Mock 500 error
      await page.route("**/api/agents", (route) =>
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: "Internal server error" }),
        })
      );

      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "error-agent");
      await page.click('button[type="submit"]');

      // Should show user-friendly error
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('text=Something went wrong')).toBeVisible();

      // Should NOT show raw error details to user
      await expect(page.locator('text=Internal server error')).not.toBeVisible();
    });

    test("should handle validation errors with field-specific feedback", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Mock validation error
      await page.route("**/api/agents", (route) =>
        route.fulfill({
          status: 400,
          body: JSON.stringify({
            error: "Validation failed",
            fields: {
              name: "Name must be at least 3 characters",
              systemPrompt: "System prompt is required",
            },
          }),
        })
      );

      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "ab"); // Too short
      await page.click('button[type="submit"]');

      // Should show field-specific errors
      await expect(page.locator('text=Name must be at least 3 characters')).toBeVisible();
      await expect(page.locator('text=System prompt is required')).toBeVisible();

      // Form should remain editable
      await expect(page.locator('input[name="name"]')).toBeEditable();
    });

    test("should handle rate limiting with backoff", async ({ page }) => {
      await page.goto("http://localhost:3000");

      let attemptCount = 0;
      await page.route("**/api/agents", (route) => {
        attemptCount++;
        if (attemptCount === 1) {
          // First request: rate limited
          route.fulfill({
            status: 429,
            headers: { "Retry-After": "2" },
            body: JSON.stringify({ error: "Rate limit exceeded" }),
          });
        } else {
          // Second request: succeed
          route.continue();
        }
      });

      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "rate-limited-agent");
      await page.click('button[type="submit"]');

      // Should show rate limit message
      await expect(
        page.locator('text=Rate limit, text=Too many requests')
      ).toBeVisible();

      // Should auto-retry after backoff and succeed
      await expect(page.locator('text=rate-limited-agent')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Agent Execution Failures", () => {
    test("should recover from agent timeout", async ({ page }) => {
      await page.goto("http://localhost:3000/chat");

      // Send message that times out
      await page.fill('textarea[name="message"]', "Execute long running task");
      await page.click('button:has-text("Send")');

      // Should show timeout error
      await expect(page.locator('text=Request timed out')).toBeVisible({ timeout: 35000 });

      // Should offer to retry
      await page.click('button:has-text("Retry")');

      // Should attempt execution again
      await expect(page.locator('[data-testid="execution-status"]:has-text("Running")')).toBeVisible();
    });

    test("should handle agent crash gracefully", async ({ page }) => {
      await page.goto("http://localhost:3000/chat");

      // Mock agent crash
      await page.route("**/api/execute", (route) =>
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            error: "Agent execution failed",
            reason: "Out of memory",
          }),
        })
      );

      await page.fill('textarea[name="message"]', "Cause crash");
      await page.click('button:has-text("Send")');

      // Should show user-friendly error
      await expect(page.locator('text=Execution failed')).toBeVisible();

      // Should NOT crash the UI
      await expect(page.locator('textarea[name="message"]')).toBeEditable();

      // Should allow starting new conversation
      await page.fill('textarea[name="message"]', "New message");
      await expect(page.locator('button:has-text("Send")')).toBeEnabled();
    });

    test("should preserve conversation history after execution error", async ({ page }) => {
      await page.goto("http://localhost:3000/chat");

      // Send successful message
      await page.fill('textarea[name="message"]', "Hello");
      await page.click('button:has-text("Send")');

      await expect(page.locator('text=Hello').first()).toBeVisible();

      // Send message that fails
      await page.route("**/api/execute", (route) => route.abort("failed"));

      await page.fill('textarea[name="message"]', "Failing message");
      await page.click('button:has-text("Send")');

      await expect(page.locator('text=Error')).toBeVisible();

      // Previous messages should still be visible
      await expect(page.locator('text=Hello').first()).toBeVisible();

      // Should be able to continue conversation
      await page.unroute("**/api/execute");
      await page.fill('textarea[name="message"]', "Continue");
      await page.click('button:has-text("Send")');

      await expect(page.locator('text=Continue').first()).toBeVisible();
    });
  });

  test.describe("State Corruption Recovery", () => {
    test("should recover from corrupted local storage", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Corrupt local storage
      await page.evaluate(() => {
        localStorage.setItem("agentik-state", "corrupted-json{{{");
      });

      // Reload page
      await page.reload();

      // Should detect corruption and reset state
      await expect(page.locator('[data-testid="state-reset-notice"]')).toBeVisible();

      // Should initialize with clean state
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    });

    test("should handle missing critical data", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Mock missing agent data
      await page.route("**/api/agents/missing-agent", (route) =>
        route.fulfill({
          status: 404,
          body: JSON.stringify({ error: "Agent not found" }),
        })
      );

      // Try to access missing agent
      await page.goto("http://localhost:3000/agents/missing-agent");

      // Should show 404 page with helpful actions
      await expect(page.locator('text=Agent not found')).toBeVisible();
      await expect(page.locator('button:has-text("Go to Dashboard")')).toBeVisible();
      await expect(page.locator('button:has-text("Create New Agent")')).toBeVisible();
    });

    test("should recover from inconsistent cache state", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Create agent
      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "cache-test-agent");
      await page.click('button[type="submit"]');

      await expect(page.locator('text=cache-test-agent')).toBeVisible();

      // Manually corrupt cache
      await page.evaluate(() => {
        // @ts-ignore
        window.__AGENT_CACHE__ = { "invalid-id": { name: "ghost-agent" } };
      });

      // Reload and verify cache is cleared
      await page.reload();

      // Should still show real agent from server
      await expect(page.locator('text=cache-test-agent')).toBeVisible();

      // Should NOT show ghost agent from corrupt cache
      await expect(page.locator('text=ghost-agent')).not.toBeVisible();
    });
  });

  test.describe("Session Recovery", () => {
    test("should restore session after page refresh", async ({ page }) => {
      await page.goto("http://localhost:3000/chat");

      // Start conversation
      await page.fill('textarea[name="message"]', "Remember this message");
      await page.click('button:has-text("Send")');

      await expect(page.locator('text=Remember this message').first()).toBeVisible();

      // Refresh page
      await page.reload();

      // Should restore conversation
      await expect(page.locator('text=Remember this message').first()).toBeVisible();
    });

    test("should handle session expiration gracefully", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Mock session expiration
      await page.route("**/api/agents", (route) =>
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: "Session expired" }),
        })
      );

      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "expired-session-agent");
      await page.click('button[type="submit"]');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);

      // Should preserve intended action after login
      // (In a real app, would re-attempt agent creation after auth)
    });

    test("should recover partial form data after error", async ({ page }) => {
      await page.goto("http://localhost:3000");

      await page.click('button:has-text("Create Agent")');

      // Fill long form
      await page.fill('input[name="name"]', "partial-recovery-agent");
      await page.fill('textarea[name="systemPrompt"]', "A very long system prompt with lots of detail...");
      await page.selectOption('select[name="model"]', "claude-sonnet-4");

      // Mock network error on submit
      await page.route("**/api/agents", (route) => route.abort("failed"), { times: 1 });

      await page.click('button[type="submit"]');

      // Should show error
      await expect(page.locator('text=Failed to create')).toBeVisible();

      // Form data should be preserved
      await expect(page.locator('input[name="name"]')).toHaveValue("partial-recovery-agent");
      await expect(page.locator('textarea[name="systemPrompt"]')).toHaveValue(
        "A very long system prompt with lots of detail..."
      );

      // Retry should work with preserved data
      await page.unroute("**/api/agents");
      await page.click('button[type="submit"]');

      await expect(page.locator('text=partial-recovery-agent')).toBeVisible();
    });
  });

  test.describe("Partial Data Recovery", () => {
    test("should recover from interrupted file upload", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Start file upload
      const [fileChooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        page.click('button:has-text("Upload Skill")'),
      ]);

      await fileChooser.setFiles({
        name: "large-skill.zip",
        mimeType: "application/zip",
        buffer: Buffer.alloc(10 * 1024 * 1024), // 10MB
      });

      // Simulate upload interruption
      await page.route("**/api/upload", (route) => route.abort("failed"), { times: 1 });

      // Should show upload progress
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();

      // Should show error
      await expect(page.locator('text=Upload failed')).toBeVisible();

      // Should offer to resume upload
      await expect(page.locator('button:has-text("Resume Upload")')).toBeVisible();

      // Resume upload
      await page.unroute("**/api/upload");
      await page.click('button:has-text("Resume Upload")');

      // Should complete upload
      await expect(page.locator('text=Upload complete')).toBeVisible({ timeout: 10000 });
    });

    test("should handle bulk operation failures gracefully", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Create 5 agents for bulk operation
      for (let i = 1; i <= 5; i++) {
        await page.click('button:has-text("Create Agent")');
        await page.fill('input[name="name"]', `bulk-agent-${i}`);
        await page.click('button[type="submit"]');
        await expect(page.locator(`text=bulk-agent-${i}`)).toBeVisible();
      }

      // Select all agents
      await page.click('input[type="checkbox"][name="select-all"]');

      // Bulk delete with partial failures
      let deleteCount = 0;
      await page.route("**/api/agents/*/delete", (route) => {
        deleteCount++;
        if (deleteCount === 3) {
          // Fail 3rd deletion
          route.abort("failed");
        } else {
          route.continue();
        }
      });

      await page.click('button:has-text("Delete Selected")');
      await page.click('button:has-text("Confirm")');

      // Should show partial success message
      await expect(page.locator('text=4 of 5 agents deleted')).toBeVisible();

      // Should show which one failed
      await expect(page.locator('text=Failed to delete bulk-agent-3')).toBeVisible();

      // Should offer to retry failed deletions
      await expect(page.locator('button:has-text("Retry Failed")')).toBeVisible();
    });
  });

  test.describe("Cascading Failures", () => {
    test("should handle multiple simultaneous errors", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Simulate multiple failures at once
      await page.route("**/api/**", (route) => route.abort("failed"));

      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "multi-error-agent");
      await page.click('button[type="submit"]');

      // Should show consolidated error, not multiple error dialogs
      const errorDialogs = page.locator('[role="alertdialog"]');
      await expect(errorDialogs).toHaveCount(1);

      // Should offer global recovery action
      await expect(page.locator('button:has-text("Reload Page")')).toBeVisible();
    });

    test("should prevent error loops with circuit breaker", async ({ page }) => {
      await page.goto("http://localhost:3000");

      let requestCount = 0;
      await page.route("**/api/agents", (route) => {
        requestCount++;
        route.abort("failed");
      });

      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "circuit-breaker-test");
      await page.click('button[type="submit"]');

      // Wait for retries to exhaust
      await page.waitForTimeout(5000);

      // Should stop retrying after max attempts (circuit breaker open)
      expect(requestCount).toBeLessThan(10); // Should not retry infinitely

      // Should show circuit breaker message
      await expect(page.locator('text=Service temporarily unavailable')).toBeVisible();
    });
  });
});
