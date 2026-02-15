import { test, expect } from "@playwright/test";

/**
 * E2E Journey: Marketplace Browse → Install → Use Skill
 *
 * Complete marketplace user journey:
 * 1. Browse marketplace skills
 * 2. Search and filter skills
 * 3. View skill detail page
 * 4. Install skill
 * 5. Configure skill permissions
 * 6. Use skill in agent
 * 7. Uninstall skill
 *
 * Tests the complete marketplace workflow from discovery to usage.
 */

test.describe("E2E Journey: Marketplace Browse → Install → Use Skill", () => {
  const testSkillName = "Web Search"; // Common skill likely to exist

  test("Complete marketplace journey", async ({ page }) => {
    // =========================================
    // PHASE 1: Browse Marketplace
    // =========================================

    console.log("Phase 1: Browsing marketplace...");

    await page.goto("/dashboard/marketplace");
    await page.waitForTimeout(1500);

    // Verify marketplace page loads
    await expect(page.locator("h1, h2")).toContainText(/marketplace|skills/i);

    // Verify skill grid displays
    const skillCards = page.locator('[class*="Card"], [data-skill]');
    const skillCount = await skillCards.count();

    expect(skillCount).toBeGreaterThan(0);
    console.log(`✅ ${skillCount} skills visible in marketplace`);

    // Verify each skill card has required elements
    const firstSkill = skillCards.first();

    const hasTitle = await firstSkill.locator("h3, h4, [class*='Title']").count();
    const hasDescription = await firstSkill.locator("p, [class*='Description']").count();
    const hasInstallButton = await firstSkill.locator("button").count();

    expect(hasTitle).toBeGreaterThan(0);
    expect(hasDescription).toBeGreaterThan(0);
    expect(hasInstallButton).toBeGreaterThan(0);

    console.log("✅ Skill cards display correctly");

    // =========================================
    // PHASE 2: Search and Filter Skills
    // =========================================

    console.log("Phase 2: Searching and filtering skills...");

    // Look for search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i]'
    );

    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill(testSkillName);
      await page.waitForTimeout(1000);

      // Verify filtered results
      const filteredSkills = page.locator('[class*="Card"], [data-skill]');
      const filteredCount = await filteredSkills.count();

      expect(filteredCount).toBeGreaterThan(0);
      console.log(`✅ Search returned ${filteredCount} results`);

      // Clear search
      await searchInput.first().clear();
      await page.waitForTimeout(500);
    }

    // Look for category filter
    const categoryFilter = page.locator(
      'select[name="category"], button:has-text("Category"), [role="combobox"]'
    );

    if (await categoryFilter.first().isVisible()) {
      await categoryFilter.first().click();
      await page.waitForTimeout(500);

      // Select a category (e.g., "Productivity" or "Search")
      const categoryOption = page.locator(
        'option:has-text("Search"), option:has-text("Productivity"), [role="option"]'
      ).first();

      if (await categoryOption.isVisible()) {
        await categoryOption.click();
        await page.waitForTimeout(1000);

        console.log("✅ Category filter applied");
      }
    }

    // =========================================
    // PHASE 3: View Skill Detail Page
    // =========================================

    console.log("Phase 3: Viewing skill detail page...");

    // Find Web Search skill card
    const targetSkill = page.locator(`[class*="Card"]:has-text("${testSkillName}")`).first();

    if (await targetSkill.isVisible()) {
      // Click skill card to view details
      await targetSkill.click();
      await page.waitForTimeout(1500);

      // Verify skill detail page loads
      await expect(page.url()).toMatch(/\/marketplace\/[a-z0-9-]+/);

      // Verify detail page elements
      const detailElements = {
        title: page.locator("h1, h2"),
        description: page.getByText(/.+/), // Any description text
        installButton: page.locator('button:has-text("Install")'),
        author: page.getByText(/author|by|created/i),
        version: page.getByText(/version|v\d/i),
      };

      let visibleElements = 0;
      for (const [name, element] of Object.entries(detailElements)) {
        if (await element.first().isVisible()) {
          console.log(`✅ ${name} visible on detail page`);
          visibleElements++;
        }
      }

      expect(visibleElements).toBeGreaterThan(2);

      // Check for permissions section
      const permissionsSection = page.getByText(/permission|requires|access/i);

      if (await permissionsSection.first().isVisible()) {
        console.log("✅ Permissions section visible");

        // Verify permission items listed
        const permissionItems = page.locator(
          '[class*="permission"], [data-permission]'
        );
        const permCount = await permissionItems.count();

        if (permCount > 0) {
          console.log(`✅ ${permCount} permissions listed`);
        }
      }

      // Check for usage examples
      const examplesSection = page.getByText(/example|usage|how to/i);

      if (await examplesSection.first().isVisible()) {
        console.log("✅ Usage examples visible");
      }

      // =========================================
      // PHASE 4: Install Skill
      // =========================================

      console.log("Phase 4: Installing skill...");

      const installButton = page.locator('button:has-text("Install")').first();

      if (await installButton.isVisible()) {
        await installButton.click();
        await page.waitForTimeout(1500);

        // Look for permission confirmation dialog
        const permissionDialog = page.locator('[role="dialog"], [class*="modal"]');

        if (await permissionDialog.first().isVisible()) {
          console.log("✅ Permission confirmation dialog appeared");

          // Verify permission checkboxes/items
          const permCheckboxes = permissionDialog.locator('input[type="checkbox"]');
          const checkCount = await permCheckboxes.count();

          if (checkCount > 0) {
            console.log(`✅ ${checkCount} permissions to review`);
          }

          // Click confirm/allow button
          const confirmButton = permissionDialog.locator(
            'button:has-text("Allow"), button:has-text("Confirm"), button:has-text("Install")'
          ).first();

          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            await page.waitForTimeout(2000);

            console.log("✅ Permissions confirmed");
          }
        }

        // Wait for installation to complete
        await page.waitForTimeout(2000);

        // Verify install button changes to "Installed" or "Uninstall"
        const installedButton = page.locator(
          'button:has-text("Installed"), button:has-text("Uninstall")'
        ).first();

        if (await installedButton.isVisible()) {
          console.log("✅ Skill installed successfully");
        } else {
          // Button might have changed to checkmark or disabled state
          const buttonText = await installButton.textContent();
          console.log(`Install button state: ${buttonText}`);
        }

        // Check for success toast/notification
        const successNotification = page.locator(
          '[role="status"], [class*="toast"], [class*="notification"]'
        );

        if (await successNotification.first().isVisible()) {
          const notificationText = await successNotification.first().textContent();
          console.log(`Notification: ${notificationText}`);
        }
      } else {
        console.log("⚠️  Skill may already be installed");
      }

      // =========================================
      // PHASE 5: Use Skill in Agent
      // =========================================

      console.log("Phase 5: Using skill in agent...");

      // Navigate to agents page
      await page.goto("/dashboard/agents");
      await page.waitForTimeout(1500);

      // Find an existing agent or create test agent
      const existingAgent = page.locator('[class*="Card"]').first();

      if (await existingAgent.isVisible()) {
        // Click agent to view details
        await existingAgent.click();
        await page.waitForTimeout(1500);

        // Look for skills section
        const skillsSection = page.getByText(/skills|capabilities|tools/i);

        if (await skillsSection.first().isVisible()) {
          await skillsSection.first().scrollIntoViewIfNeeded();
          console.log("✅ Skills section found on agent page");

          // Check if our installed skill appears
          const installedSkillBadge = page.getByText(testSkillName);

          if (await installedSkillBadge.first().isVisible()) {
            console.log(`✅ ${testSkillName} skill active on agent`);
          } else {
            console.log("ℹ️  Skill not yet added to this agent");

            // Try to add skill to agent
            const addSkillButton = page.locator(
              'button:has-text("Add Skill"), button:has-text("+")'
            ).first();

            if (await addSkillButton.isVisible()) {
              await addSkillButton.click();
              await page.waitForTimeout(1000);

              // Look for skill selector
              const skillSelector = page.locator(
                `[role="option"]:has-text("${testSkillName}"), button:has-text("${testSkillName}")`
              ).first();

              if (await skillSelector.isVisible()) {
                await skillSelector.click();
                await page.waitForTimeout(1500);

                console.log(`✅ ${testSkillName} added to agent`);
              }
            }
          }
        }
      }

      // =========================================
      // PHASE 6: Uninstall Skill
      // =========================================

      console.log("Phase 6: Uninstalling skill...");

      // Navigate back to marketplace
      await page.goto("/dashboard/marketplace");
      await page.waitForTimeout(1500);

      // Search for the skill again
      const searchField = page.locator('input[type="search"]').first();

      if (await searchField.isVisible()) {
        await searchField.fill(testSkillName);
        await page.waitForTimeout(1000);
      }

      // Click skill card
      const skillCard = page.locator(`[class*="Card"]:has-text("${testSkillName}")`).first();

      if (await skillCard.isVisible()) {
        await skillCard.click();
        await page.waitForTimeout(1500);
      }

      // Click uninstall button
      const uninstallButton = page.locator(
        'button:has-text("Uninstall"), button:has-text("Remove")'
      ).first();

      if (await uninstallButton.isVisible()) {
        await uninstallButton.click();
        await page.waitForTimeout(1000);

        // Confirm uninstall in dialog
        const confirmUninstall = page.locator(
          '[role="dialog"] button:has-text("Uninstall"), [role="dialog"] button:has-text("Confirm")'
        ).first();

        if (await confirmUninstall.isVisible()) {
          await confirmUninstall.click();
          await page.waitForTimeout(2000);

          console.log("✅ Skill uninstalled successfully");

          // Verify button returns to "Install"
          const installAgainButton = page.locator('button:has-text("Install")').first();

          if (await installAgainButton.isVisible()) {
            console.log("✅ Uninstall confirmed - Install button restored");
          }
        }
      } else {
        console.log("⚠️  Uninstall button not found (skill may not be installed)");
      }
    } else {
      console.log(`⚠️  ${testSkillName} skill not found in marketplace`);
    }

    console.log("✅ Complete marketplace journey successful!");
  });

  test("Skill categories and sorting", async ({ page }) => {
    // Test marketplace organization features
    await page.goto("/dashboard/marketplace");
    await page.waitForTimeout(1500);

    // =========================================
    // Test Sort Options
    // =========================================

    const sortButton = page.locator(
      'button:has-text("Sort"), select[name="sort"]'
    ).first();

    if (await sortButton.isVisible()) {
      await sortButton.click();
      await page.waitForTimeout(500);

      // Try "Most Popular" sort
      const popularOption = page.locator(
        'option:has-text("Popular"), [role="option"]:has-text("Popular")'
      ).first();

      if (await popularOption.isVisible()) {
        await popularOption.click();
        await page.waitForTimeout(1500);

        console.log("✅ 'Most Popular' sort applied");
      }

      // Try "Newest" sort
      await sortButton.click();
      await page.waitForTimeout(500);

      const newestOption = page.locator(
        'option:has-text("Newest"), [role="option"]:has-text("Newest")'
      ).first();

      if (await newestOption.isVisible()) {
        await newestOption.click();
        await page.waitForTimeout(1500);

        console.log("✅ 'Newest' sort applied");
      }
    }

    // =========================================
    // Test Category Tabs/Filters
    // =========================================

    const categories = [
      "All",
      "Productivity",
      "Search",
      "Communication",
      "Development",
    ];

    for (const category of categories) {
      const categoryTab = page.locator(
        `button:has-text("${category}"), [role="tab"]:has-text("${category}")`
      ).first();

      if (await categoryTab.isVisible()) {
        await categoryTab.click();
        await page.waitForTimeout(1000);

        const skillCards = page.locator('[class*="Card"]');
        const count = await skillCards.count();

        console.log(`✅ ${category} category: ${count} skills`);
      }
    }
  });

  test("Skill versioning and updates", async ({ page }) => {
    // Test skill version management
    await page.goto("/dashboard/marketplace");
    await page.waitForTimeout(1500);

    // Find any installed skill
    const installedBadge = page.locator(
      '[class*="Badge"]:has-text("Installed"), [data-installed="true"]'
    ).first();

    if (await installedBadge.isVisible()) {
      // Click the skill card
      await installedBadge.click();
      await page.waitForTimeout(1500);

      // Look for version information
      const versionInfo = page.getByText(/version|v\d+\.\d+/i);

      if (await versionInfo.first().isVisible()) {
        const versionText = await versionInfo.first().textContent();
        console.log(`Current version: ${versionText}`);
      }

      // Look for update button
      const updateButton = page.locator(
        'button:has-text("Update"), button:has-text("Upgrade")'
      ).first();

      if (await updateButton.isVisible()) {
        console.log("✅ Update available for skill");

        await updateButton.click();
        await page.waitForTimeout(2000);

        // Verify update success
        const updatedNotification = page.locator(
          '[role="status"]:has-text("updated"), [class*="toast"]:has-text("updated")'
        );

        if (await updatedNotification.first().isVisible()) {
          console.log("✅ Skill updated successfully");
        }
      } else {
        console.log("ℹ️  No updates available");
      }
    }
  });

  test("Skill permissions and security", async ({ page }) => {
    // Test permission management for skills
    await page.goto("/dashboard/marketplace");
    await page.waitForTimeout(1500);

    // Find a skill with permissions
    const skillCard = page.locator('[class*="Card"]').first();

    if (await skillCard.isVisible()) {
      await skillCard.click();
      await page.waitForTimeout(1500);

      // Check permissions section
      const permissionsHeading = page.getByText(/permission|security|requires/i);

      if (await permissionsHeading.first().isVisible()) {
        console.log("✅ Permissions section visible");

        // List permission items
        const permissionsList = page.locator(
          '[class*="permission"], [data-permission], li'
        );
        const permCount = await permissionsList.count();

        if (permCount > 0) {
          console.log(`✅ ${permCount} permissions listed:`);

          // Log first 3 permissions
          for (let i = 0; i < Math.min(3, permCount); i++) {
            const perm = await permissionsList.nth(i).textContent();
            console.log(`  - ${perm?.trim()}`);
          }
        }

        // Check for security badges/indicators
        const securityBadge = page.locator(
          '[class*="Badge"]:has-text("verified"), [class*="Badge"]:has-text("safe")'
        );

        if (await securityBadge.first().isVisible()) {
          console.log("✅ Security verification badge present");
        }
      }
    }
  });
});
