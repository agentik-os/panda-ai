import { test, expect } from "@playwright/test";

/**
 * E2E Journey: Multi-User Scenarios
 *
 * Tests concurrent user interactions and multi-tenancy:
 * 1. Multiple users accessing same dashboard
 * 2. User isolation (one user's agents don't appear for another)
 * 3. Concurrent agent execution
 * 4. Shared workspace collaboration
 * 5. Real-time updates between users
 *
 * Target: Validate multi-tenancy and concurrent access
 */

test.describe("Multi-User Scenarios", () => {
  test.describe("User Isolation", () => {
    test("should isolate agents between different users", async ({ browser }) => {
      // Create two separate browser contexts for two users
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // User 1: Create an agent
      await page1.goto("http://localhost:3000");
      await page1.click('button:has-text("Create Agent")');
      await page1.fill('input[name="name"]', "user1-agent");
      await page1.fill('textarea[name="systemPrompt"]', "You are user 1's agent");
      await page1.click('button[type="submit"]');

      await expect(page1.locator('text=user1-agent')).toBeVisible();

      // User 2: Should NOT see user 1's agent
      await page2.goto("http://localhost:3000");

      await expect(page2.locator('text=user1-agent')).not.toBeVisible();

      // User 2: Create their own agent
      await page2.click('button:has-text("Create Agent")');
      await page2.fill('input[name="name"]', "user2-agent");
      await page2.fill('textarea[name="systemPrompt"]', "You are user 2's agent");
      await page2.click('button[type="submit"]');

      await expect(page2.locator('text=user2-agent')).toBeVisible();

      // User 1: Should NOT see user 2's agent
      await page1.reload();
      await expect(page1.locator('text=user2-agent')).not.toBeVisible();
      await expect(page1.locator('text=user1-agent')).toBeVisible();

      await context1.close();
      await context2.close();
    });

    test("should isolate cost tracking between users", async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // User 1: Navigate to cost dashboard
      await page1.goto("http://localhost:3000/costs");

      // User 1: Execute agent to generate costs
      await page1.goto("http://localhost:3000/chat");
      await page1.click('button:has-text("user1-agent")'); // From previous test
      await page1.fill('textarea[name="message"]', "Hello");
      await page1.click('button:has-text("Send")');

      // Wait for execution cost
      await page1.waitForTimeout(1000);

      // User 1: Check cost dashboard
      await page1.goto("http://localhost:3000/costs");
      const user1Cost = await page1.textContent('[data-testid="total-cost"]');

      // User 2: Check their cost dashboard (should be 0)
      await page2.goto("http://localhost:3000/costs");
      const user2Cost = await page2.textContent('[data-testid="total-cost"]');

      expect(user1Cost).not.toBe("$0.00");
      expect(user2Cost).toBe("$0.00");

      await context1.close();
      await context2.close();
    });
  });

  test.describe("Concurrent Access", () => {
    test("should handle concurrent agent execution", async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // Both users execute agents simultaneously
      await page1.goto("http://localhost:3000/chat");
      await page2.goto("http://localhost:3000/chat");

      // Start executions
      const execution1 = page1.fill('textarea[name="message"]', "Task 1 for user 1");
      const execution2 = page2.fill('textarea[name="message"]', "Task 2 for user 2");

      await Promise.all([execution1, execution2]);

      await page1.click('button:has-text("Send")');
      await page2.click('button:has-text("Send")');

      // Both should complete successfully
      await expect(page1.locator('[data-testid="message-response"]')).toBeVisible({ timeout: 30000 });
      await expect(page2.locator('[data-testid="message-response"]')).toBeVisible({ timeout: 30000 });

      await context1.close();
      await context2.close();
    });

    test("should handle concurrent dashboard navigation", async ({ browser }) => {
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
      ]);

      const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));

      // All users navigate simultaneously
      await Promise.all(
        pages.map((page) =>
          page.goto("http://localhost:3000").then(() => page.click('a[href="/agents"]'))
        )
      );

      // All should load successfully
      await Promise.all(
        pages.map((page) => expect(page.locator('h1:has-text("Agents")')).toBeVisible())
      );

      await Promise.all(contexts.map((ctx) => ctx.close()));
    });
  });

  test.describe("Shared Workspace Collaboration", () => {
    test("should support shared workspace access", async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // User 1: Create shared workspace
      await page1.goto("http://localhost:3000/workspaces");
      await page1.click('button:has-text("Create Workspace")');
      await page1.fill('input[name="name"]', "shared-project");
      await page1.check('input[name="shared"]');
      await page1.fill('input[name="shareWith"]', "user2@example.com");
      await page1.click('button[type="submit"]');

      await expect(page1.locator('text=shared-project')).toBeVisible();

      // User 2: Access shared workspace
      await page2.goto("http://localhost:3000/workspaces");
      await expect(page2.locator('text=shared-project')).toBeVisible();

      // User 2: Create agent in shared workspace
      await page2.click('text=shared-project');
      await page2.click('button:has-text("Add Agent")');
      await page2.fill('input[name="name"]', "shared-agent");
      await page2.click('button[type="submit"]');

      // User 1: Should see agent created by User 2
      await page1.reload();
      await page1.click('text=shared-project');
      await expect(page1.locator('text=shared-agent')).toBeVisible();

      await context1.close();
      await context2.close();
    });

    test("should sync real-time updates between users in shared workspace", async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // Both users open shared workspace
      await page1.goto("http://localhost:3000/workspaces/shared-project");
      await page2.goto("http://localhost:3000/workspaces/shared-project");

      // User 1: Execute agent
      await page1.click('button:has-text("Execute")');

      // User 2: Should see execution status update in real-time
      await expect(page2.locator('[data-testid="execution-status"]:has-text("Running")')).toBeVisible({
        timeout: 5000,
      });

      // Wait for completion
      await expect(page2.locator('[data-testid="execution-status"]:has-text("Completed")')).toBeVisible({
        timeout: 30000,
      });

      await context1.close();
      await context2.close();
    });
  });

  test.describe("Resource Limits Per User", () => {
    test("should enforce per-user agent limits", async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto("http://localhost:3000");

      // Create agents up to limit (assume limit is 10 for free tier)
      for (let i = 0; i < 10; i++) {
        await page.click('button:has-text("Create Agent")');
        await page.fill('input[name="name"]', `agent-${i}`);
        await page.click('button[type="submit"]');
        await page.waitForSelector(`text=agent-${i}`);
      }

      // Attempt to create 11th agent
      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "agent-11");
      await page.click('button[type="submit"]');

      // Should show limit error
      await expect(page.locator('text=agent limit, text=upgrade')).toBeVisible();

      await context.close();
    });
  });

  test.describe("User Session Management", () => {
    test("should maintain separate sessions for concurrent users", async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // User 1: Login and create session
      await page1.goto("http://localhost:3000");
      // ... authentication flow ...

      // User 2: Login with different account
      await page2.goto("http://localhost:3000");
      // ... different authentication flow ...

      // User 1: Execute agent
      await page1.goto("http://localhost:3000/chat");
      await page1.fill('textarea[name="message"]', "User 1's message");
      await page1.click('button:has-text("Send")');

      // User 2: Execute agent
      await page2.goto("http://localhost:3000/chat");
      await page2.fill('textarea[name="message"]', "User 2's message");
      await page2.click('button:has-text("Send")');

      // Verify responses are isolated
      const response1 = await page1.locator('[data-testid="message-response"]').textContent();
      const response2 = await page2.locator('[data-testid="message-response"]').textContent();

      expect(response1).toContain("User 1");
      expect(response2).toContain("User 2");
      expect(response1).not.toBe(response2);

      await context1.close();
      await context2.close();
    });
  });
});
