import { test, expect } from "@playwright/test";

/**
 * E2E Journey: Permission Enforcement
 *
 * Tests that the permission system correctly enforces access controls:
 * 1. Skill permissions (file-ops, network, system)
 * 2. User role permissions (viewer, editor, admin)
 * 3. Workspace permissions (owner, member, viewer)
 * 4. Resource access controls
 * 5. API permission validation
 *
 * Target: Validate security boundaries across the platform
 */

test.describe("Permission Enforcement", () => {
  test.describe("Skill Permissions", () => {
    test("should prevent skill from accessing unauthorized resources", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Create agent with restricted permissions
      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "restricted-agent");
      await page.fill('textarea[name="systemPrompt"]', "You are a restricted agent");

      // Add skill with only network permission (no file-ops)
      await page.click('button:has-text("Add Skill")');
      await page.selectOption('select[name="skill"]', "web-search");
      await page.click('button[type="submit"]');

      // Execute agent and try to access files
      await page.click('button:has-text("Execute")');
      await page.fill('textarea[name="message"]', "Read /etc/passwd");
      await page.click('button:has-text("Send")');

      // Should show permission denied error
      await expect(page.locator('text=Permission denied, text=file-ops')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('[data-testid="error-message"]')).toContainText("file-ops");
    });

    test("should allow skill to access authorized resources", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Create agent with file-ops permission
      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "file-agent");
      await page.fill('textarea[name="systemPrompt"]', "You are a file agent");

      // Add skill with file-ops permission
      await page.click('button:has-text("Add Skill")');
      await page.selectOption('select[name="skill"]', "file-ops");
      await page.check('input[name="permissions"][value="file-ops"]');
      await page.click('button[type="submit"]');

      // Execute agent and access files (should succeed)
      await page.click('button:has-text("Execute")');
      await page.fill('textarea[name="message"]', "List files in current directory");
      await page.click('button:has-text("Send")');

      // Should show successful execution
      await expect(page.locator('[data-testid="message-response"]')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('[data-testid="execution-status"]:has-text("Success")')).toBeVisible();
    });

    test("should enforce permission hierarchy", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // Create agent with no system permission
      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "no-system-agent");

      // Try to execute system command
      await page.click('button:has-text("Execute")');
      await page.fill('textarea[name="message"]', "Execute: rm -rf /");
      await page.click('button:has-text("Send")');

      // Should block system command
      await expect(page.locator('text=system permission required')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("User Role Permissions", () => {
    test("should restrict viewer role to read-only access", async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Login as viewer
      await page.goto("http://localhost:3000");
      // ... authentication flow for viewer role ...

      // Verify viewer can see agents
      await page.goto("http://localhost:3000/agents");
      await expect(page.locator('[data-testid="agent-list"]')).toBeVisible();

      // Verify viewer CANNOT create agents
      const createButton = page.locator('button:has-text("Create Agent")');
      if (await createButton.isVisible()) {
        await createButton.click();
        await expect(page.locator('text=Insufficient permissions')).toBeVisible();
      } else {
        // Button should be hidden for viewers
        await expect(createButton).not.toBeVisible();
      }

      // Verify viewer CANNOT delete agents
      await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();

      await context.close();
    });

    test("should allow editor role to create and modify", async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Login as editor
      await page.goto("http://localhost:3000");
      // ... authentication flow for editor role ...

      // Verify editor can create agents
      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "editor-created-agent");
      await page.click('button[type="submit"]');

      await expect(page.locator('text=editor-created-agent')).toBeVisible();

      // Verify editor can modify agents
      await page.click('text=editor-created-agent');
      await page.click('button:has-text("Edit")');
      await page.fill('input[name="name"]', "modified-agent");
      await page.click('button[type="submit"]');

      await expect(page.locator('text=modified-agent')).toBeVisible();

      // Verify editor CANNOT delete other users' agents
      const deleteButton = page.locator('button:has-text("Delete")');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await expect(page.locator('text=Only owner or admin can delete')).toBeVisible();
      }

      await context.close();
    });

    test("should grant admin role full access", async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Login as admin
      await page.goto("http://localhost:3000");
      // ... authentication flow for admin role ...

      // Verify admin can create
      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "admin-agent");
      await page.click('button[type="submit"]');

      await expect(page.locator('text=admin-agent')).toBeVisible();

      // Verify admin can delete any agent
      await page.click('button[data-testid="delete-admin-agent"]');
      await page.click('button:has-text("Confirm")');

      await expect(page.locator('text=admin-agent')).not.toBeVisible();

      // Verify admin can access settings
      await page.goto("http://localhost:3000/settings");
      await expect(page.locator('[data-testid="admin-settings"]')).toBeVisible();

      await context.close();
    });
  });

  test.describe("Workspace Permissions", () => {
    test("should enforce workspace owner permissions", async ({ browser }) => {
      const ownerContext = await browser.newContext();
      const ownerPage = await ownerContext.newPage();

      // Owner creates workspace
      await ownerPage.goto("http://localhost:3000/workspaces");
      await ownerPage.click('button:has-text("Create Workspace")');
      await ownerPage.fill('input[name="name"]', "team-workspace");
      await ownerPage.click('button[type="submit"]');

      // Owner can add members
      await ownerPage.click('text=team-workspace');
      await ownerPage.click('button:has-text("Add Member")');
      await ownerPage.fill('input[name="email"]', "member@example.com");
      await ownerPage.selectOption('select[name="role"]', "member");
      await ownerPage.click('button[type="submit"]');

      await expect(ownerPage.locator('text=member@example.com')).toBeVisible();

      // Owner can delete workspace
      await ownerPage.click('button:has-text("Delete Workspace")');
      await ownerPage.click('button:has-text("Confirm")');

      await expect(ownerPage.locator('text=team-workspace')).not.toBeVisible();

      await ownerContext.close();
    });

    test("should restrict workspace member permissions", async ({ browser }) => {
      const memberContext = await browser.newContext();
      const memberPage = await memberContext.newPage();

      // Login as workspace member
      await memberPage.goto("http://localhost:3000/workspaces");

      // Member can view workspace
      await expect(memberPage.locator('text=team-workspace')).toBeVisible();

      // Member can add agents to workspace
      await memberPage.click('text=team-workspace');
      await memberPage.click('button:has-text("Add Agent")');
      await memberPage.fill('input[name="name"]', "member-agent");
      await memberPage.click('button[type="submit"]');

      await expect(memberPage.locator('text=member-agent')).toBeVisible();

      // Member CANNOT add other members
      const addMemberButton = memberPage.locator('button:has-text("Add Member")');
      if (await addMemberButton.isVisible()) {
        await addMemberButton.click();
        await expect(memberPage.locator('text=Only owner can add members')).toBeVisible();
      } else {
        await expect(addMemberButton).not.toBeVisible();
      }

      // Member CANNOT delete workspace
      await expect(memberPage.locator('button:has-text("Delete Workspace")')).not.toBeVisible();

      await memberContext.close();
    });

    test("should restrict workspace viewer permissions", async ({ browser }) => {
      const viewerContext = await browser.newContext();
      const viewerPage = await viewerContext.newPage();

      // Login as workspace viewer
      await viewerPage.goto("http://localhost:3000/workspaces/team-workspace");

      // Viewer can see agents
      await expect(viewerPage.locator('[data-testid="agent-list"]')).toBeVisible();

      // Viewer CANNOT add agents
      await expect(viewerPage.locator('button:has-text("Add Agent")')).not.toBeVisible();

      // Viewer CANNOT execute agents
      const executeButton = viewerPage.locator('button:has-text("Execute")');
      if (await executeButton.isVisible()) {
        await executeButton.click();
        await expect(viewerPage.locator('text=Execute permission required')).toBeVisible();
      } else {
        await expect(executeButton).not.toBeVisible();
      }

      await viewerContext.close();
    });
  });

  test.describe("API Permission Validation", () => {
    test("should validate API key permissions", async ({ request }) => {
      // Try to create agent with read-only API key
      const response = await request.post("http://localhost:3000/api/agents", {
        headers: {
          Authorization: "Bearer read-only-key",
        },
        data: {
          name: "test-agent",
          systemPrompt: "Test",
        },
      });

      expect(response.status()).toBe(403);
      const body = await response.json();
      expect(body.error.toLowerCase()).toMatch(/permission|forbidden/);
    });

    test("should allow API operations with correct permissions", async ({ request }) => {
      // Create agent with write API key
      const response = await request.post("http://localhost:3000/api/agents", {
        headers: {
          Authorization: "Bearer write-key",
        },
        data: {
          name: "api-agent",
          systemPrompt: "API created agent",
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.name).toBe("api-agent");
    });

    test("should enforce rate limits by permission tier", async ({ request }) => {
      // Free tier: 10 requests per minute
      for (let i = 0; i < 11; i++) {
        const response = await request.get("http://localhost:3000/api/agents", {
          headers: {
            Authorization: "Bearer free-tier-key",
          },
        });

        if (i < 10) {
          expect(response.status()).toBe(200);
        } else {
          // 11th request should be rate limited
          expect(response.status()).toBe(429);
          const body = await response.json();
          expect(body.error).toContain("rate limit");
        }
      }
    });
  });

  test.describe("Cross-Permission Scenarios", () => {
    test("should handle permission conflicts gracefully", async ({ page }) => {
      await page.goto("http://localhost:3000");

      // User A creates a private agent
      await page.click('button:has-text("Create Agent")');
      await page.fill('input[name="name"]', "private-agent");
      await page.check('input[name="private"]');
      await page.click('button[type="submit"]');

      // User B tries to access User A's private agent (should fail)
      // ... switch to User B context ...
      await page.goto("http://localhost:3000/agents/private-agent");

      await expect(
        page.locator('text=Not found, text=Access denied')
      ).toBeVisible();
    });

    test("should allow permission escalation through workspace sharing", async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // User 1 creates workspace and shares with User 2
      await page1.goto("http://localhost:3000/workspaces");
      await page1.click('button:has-text("Create Workspace")');
      await page1.fill('input[name="name"]', "shared-workspace");
      await page1.click('button[type="submit"]');

      await page1.click('button:has-text("Share")');
      await page1.fill('input[name="email"]', "user2@example.com");
      await page1.selectOption('select[name="role"]', "editor");
      await page1.click('button[type="submit"]');

      // User 2 can now access and edit in shared workspace
      await page2.goto("http://localhost:3000/workspaces/shared-workspace");
      await page2.click('button:has-text("Add Agent")');
      await page2.fill('input[name="name"]', "shared-agent");
      await page2.click('button[type="submit"]');

      await expect(page2.locator('text=shared-agent')).toBeVisible();

      await context1.close();
      await context2.close();
    });
  });
});
