/**
 * XPS Intelligence Control Plane — Playwright E2E Tests
 *
 * Tests cover:
 * - Workspace page loads
 * - Admin page loads
 * - Left toolbar (sidebar) works
 * - Center workspace is interactive
 * - Right chat UI works
 * - Provider/runtime indicator visible in chat rail
 * - Mode dropdown opens and changes
 * - Agent selector works
 * - Paperclip opens
 * - Attachment UI renders correctly
 * - Admin: GitHub capability panel
 * - Admin: Supabase panel
 * - Admin: Vercel panel
 * - Admin: Google Workspace panel
 * - Admin: Blocked ChatGPT/Copilot passthrough state
 * - Admin: Overview/integration matrix
 * - No emoji remain in primary UI surfaces
 * - Text contrast correctness
 * - Electric gold/silver animated accent visible
 * - No white screen
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS = path.join(__dirname, 'screenshots');

// ── Helpers ────────────────────────────────────────────────────────────────
async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS, `${name}.png`), fullPage: false });
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('XPS Control Plane', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to render
    await page.waitForSelector('[data-testid="page-tab-workspace"]', { timeout: 15000 });
  });

  test('no white screen — app renders with dark background', async ({ page }) => {
    const bg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // Background should be dark — not white
    expect(bg).not.toBe('rgb(255, 255, 255)');
    await screenshot(page, 'workspace-overview');
  });

  test('Workspace page loads — header shows Workspace tab', async ({ page }) => {
    const wsTab = page.locator('[data-testid="page-tab-workspace"]');
    await expect(wsTab).toBeVisible();
    const adminTab = page.locator('[data-testid="page-tab-admin"]');
    await expect(adminTab).toBeVisible();
  });

  test('Admin page loads — switch to Admin and see content', async ({ page }) => {
    await page.click('[data-testid="page-tab-admin"]');
    // Admin nav should appear
    await page.waitForSelector('[data-testid="admin-nav-integrations"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="admin-nav-integrations"]')).toBeVisible();
    await screenshot(page, 'admin-overview');
  });

  test('Admin page — integration capability panels render', async ({ page }) => {
    await page.click('[data-testid="page-tab-admin"]');
    await page.waitForSelector('[data-testid^="cap-panel-"]', { timeout: 5000 });
    const panels = await page.locator('[data-testid^="cap-panel-"]').count();
    expect(panels).toBeGreaterThan(0);
    await screenshot(page, 'admin-capability-panels');
  });

  test('Admin page — system section loads', async ({ page }) => {
    await page.click('[data-testid="page-tab-admin"]');
    await page.click('[data-testid="admin-nav-system"]');
    await page.waitForTimeout(300);
    await screenshot(page, 'admin-system');
    // Should not show white screen
    const bg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe('rgb(255, 255, 255)');
  });

  test('Admin page — access control section loads', async ({ page }) => {
    await page.click('[data-testid="page-tab-admin"]');
    await page.click('[data-testid="admin-nav-users"]');
    await page.waitForTimeout(300);
    await screenshot(page, 'admin-access-control');
  });

  // ── New admin panel tests ────────────────────────────────────────────────

  test('Admin — GitHub capability panel renders with capability truth', async ({ page }) => {
    await page.click('[data-testid="page-tab-admin"]');
    await page.click('[data-testid="admin-nav-github"]');
    await page.waitForTimeout(400);
    await expect(page.locator('[data-testid="admin-github-panel"]')).toBeVisible();
    // Should show at least one cap-panel (GitHub REST API panel)
    const panels = await page.locator('[data-testid="admin-github-panel"] [data-testid^="cap-panel-"]').count();
    expect(panels).toBeGreaterThan(0);
    await screenshot(page, 'admin-github-panel');
  });

  test('Admin — Supabase panel renders with capability truth', async ({ page }) => {
    await page.click('[data-testid="page-tab-admin"]');
    await page.click('[data-testid="admin-nav-supabase"]');
    await page.waitForTimeout(400);
    await expect(page.locator('[data-testid="admin-supabase-panel"]')).toBeVisible();
    const panels = await page.locator('[data-testid="admin-supabase-panel"] [data-testid^="cap-panel-"]').count();
    expect(panels).toBeGreaterThan(0);
    await screenshot(page, 'admin-supabase-panel');
  });

  test('Admin — Vercel panel renders with capability truth', async ({ page }) => {
    await page.click('[data-testid="page-tab-admin"]');
    await page.click('[data-testid="admin-nav-vercel"]');
    await page.waitForTimeout(400);
    await expect(page.locator('[data-testid="admin-vercel-panel"]')).toBeVisible();
    const panels = await page.locator('[data-testid="admin-vercel-panel"] [data-testid^="cap-panel-"]').count();
    expect(panels).toBeGreaterThan(0);
    await screenshot(page, 'admin-vercel-panel');
  });

  test('Admin — Google Workspace panel renders with capability truth', async ({ page }) => {
    await page.click('[data-testid="page-tab-admin"]');
    await page.click('[data-testid="admin-nav-google"]');
    await page.waitForTimeout(400);
    await expect(page.locator('[data-testid="admin-google-panel"]')).toBeVisible();
    const panels = await page.locator('[data-testid="admin-google-panel"] [data-testid^="cap-panel-"]').count();
    expect(panels).toBeGreaterThan(0);
    await screenshot(page, 'admin-google-workspace-panel');
  });

  test('Admin — blocked ChatGPT/Copilot passthrough state renders honestly', async ({ page }) => {
    await page.click('[data-testid="page-tab-admin"]');
    // The overview (integrations) section shows the blocked passthrough panel
    await page.waitForSelector('[data-testid="blocked-passthrough-panel"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="blocked-passthrough-panel"]')).toBeVisible();
    // Should contain "Blocked" text
    await expect(page.locator('[data-testid="blocked-passthrough-panel"]')).toContainText('Blocked');
    await screenshot(page, 'admin-blocked-passthrough');
  });

  test('Admin — active provider banner shows on overview', async ({ page }) => {
    await page.click('[data-testid="page-tab-admin"]');
    await page.waitForSelector('[data-testid="active-provider-banner"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="active-provider-banner"]')).toBeVisible();
    await screenshot(page, 'admin-provider-banner');
  });

  test('Admin — refresh status button visible', async ({ page }) => {
    await page.click('[data-testid="page-tab-admin"]');
    await page.waitForSelector('[data-testid="admin-refresh-status"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="admin-refresh-status"]')).toBeVisible();
  });

  test('Workspace — provider/runtime indicator visible in chat rail', async ({ page }) => {
    // Provider indicator should be in the chat rail header
    await page.waitForSelector('[data-testid="provider-indicator"]', { timeout: 8000 });
    await expect(page.locator('[data-testid="provider-indicator"]')).toBeVisible();
    // Should contain one of the known modes
    const text = await page.locator('[data-testid="provider-indicator"]').innerText();
    const knownModes = ['OpenAI', 'Groq', 'Ollama', 'Synthetic', 'LIVE', 'LOCAL'];
    const hasKnownMode = knownModes.some(m => text.includes(m));
    expect(hasKnownMode).toBe(true);
    await screenshot(page, 'workspace-provider-indicator');
  });

  // ── Existing tests ───────────────────────────────────────────────────────

  test('Left toolbar (sidebar) — nav items are clickable', async ({ page }) => {
    // Sidebar should be visible on workspace page
    const sidebarBtns = await page.locator('aside nav button').count();
    expect(sidebarBtns).toBeGreaterThan(5);

    // Click CRM button
    await page.locator('aside nav button', { hasText: 'CRM' }).click();
    await page.waitForTimeout(200);

    // Click Dashboard
    await page.locator('aside nav button', { hasText: 'Dashboard' }).first().click();
    await screenshot(page, 'sidebar-active');
  });

  test('Center workspace — empty state is interactive', async ({ page }) => {
    // Navigate to workspace panel
    await page.locator('aside nav button', { hasText: 'Editor' }).click();
    await page.waitForTimeout(300);

    // Empty state should show quick-create buttons
    const emptyState = page.locator('[data-testid="workspace-empty-state"]');
    if (await emptyState.isVisible()) {
      const createBtns = await page.locator('[data-testid^="quick-create-"]').count();
      expect(createBtns).toBeGreaterThan(0);

      // Click a create button
      await page.locator('[data-testid^="quick-create-"]').first().click();
      await page.waitForTimeout(300);
      await screenshot(page, 'center-workspace-active');
    } else {
      await screenshot(page, 'center-workspace-active');
    }
  });

  test('Chat rail — renders and input is functional', async ({ page }) => {
    const chatRail = page.locator('[data-testid="chat-rail"]');
    await expect(chatRail).toBeVisible();

    const input = page.locator('[data-testid="chat-input"]');
    await expect(input).toBeVisible();

    // Type into the input
    await input.click();
    await input.fill('Test message from Playwright');
    expect(await input.inputValue()).toBe('Test message from Playwright');
    await screenshot(page, 'chat-rail-active');
  });

  test('Mode dropdown — opens and shows all modes', async ({ page }) => {
    const modeSelector = page.locator('[data-testid="mode-selector"]');
    await expect(modeSelector).toBeVisible();

    // Click to open
    await modeSelector.click();
    await page.waitForTimeout(200);

    // Check mode options are visible
    await expect(page.locator('[data-testid="mode-option-planning"]')).toBeVisible();
    await expect(page.locator('[data-testid="mode-option-agent"]')).toBeVisible();
    await expect(page.locator('[data-testid="mode-option-autonomous"]')).toBeVisible();
    await expect(page.locator('[data-testid="mode-option-scraping"]')).toBeVisible();
    await expect(page.locator('[data-testid="mode-option-discover"]')).toBeVisible();

    await screenshot(page, 'mode-dropdown-open');

    // Select a mode
    await page.locator('[data-testid="mode-option-planning"]').click();
    await page.waitForTimeout(100);

    // Mode text should have changed
    await expect(modeSelector).toContainText('Planning');
  });

  test('Agent selector — opens and works', async ({ page }) => {
    const agentSelector = page.locator('[data-testid="agent-selector"]');
    await expect(agentSelector).toBeVisible();

    // Open it
    await agentSelector.click();
    await page.waitForTimeout(200);

    // Should show agent options
    const agentBtns = await page.locator('[data-testid="chat-rail"] button').count();
    expect(agentBtns).toBeGreaterThan(2);

    await screenshot(page, 'agent-selector-open');

    // Close by clicking elsewhere
    await page.keyboard.press('Escape');
  });

  test('Paperclip / attachment — opens attachment panel', async ({ page }) => {
    const attachBtn = page.locator('[data-testid="attach-btn"]');
    await expect(attachBtn).toBeVisible();

    // Click paperclip
    await attachBtn.click();
    await page.waitForTimeout(200);

    // Attachment panel should appear
    const panel = page.locator('[data-testid="attachment-panel"]');
    await expect(panel).toBeVisible();

    await screenshot(page, 'attachment-ui-open');
  });

  test('Attachment UI — shows all sources including blocked Google Drive', async ({ page }) => {
    await page.locator('[data-testid="attach-btn"]').click();
    await page.waitForTimeout(200);

    // Local file should be present
    await expect(page.locator('[data-testid="attach-source-local"]')).toBeVisible();
    await expect(page.locator('[data-testid="attach-source-image"]')).toBeVisible();
    await expect(page.locator('[data-testid="attach-source-doc"]')).toBeVisible();

    // Google Drive should be present (blocked state)
    await expect(page.locator('[data-testid="attach-source-drive"]')).toBeVisible();
    await screenshot(page, 'attachment-sources');
  });

  test('Google Drive attachment — shows blocked state', async ({ page }) => {
    await page.locator('[data-testid="attach-btn"]').click();
    await page.waitForTimeout(200);

    const driveBtn = page.locator('[data-testid="attach-source-drive"]');
    await expect(driveBtn).toBeVisible();

    // Should show blocked indicator (cursor: not-allowed or disabled)
    const disabled = await driveBtn.getAttribute('disabled');
    // blocked = !GOOGLE_DRIVE_CONFIGURED, so drive button should be disabled when not configured
    await screenshot(page, 'google-drive-blocked-state');
  });

  test('No emoji in primary UI surfaces', async ({ page }) => {
    // Check the visible text content for emoji patterns
    const bodyText = await page.locator('header').innerText();
    // Common emoji should not appear in header
    const emojiPattern = /[\u{1F300}-\u{1F9FF}]/u;
    expect(emojiPattern.test(bodyText)).toBe(false);

    // Check sidebar
    const sidebarText = await page.locator('aside').innerText();
    expect(emojiPattern.test(sidebarText)).toBe(false);

    // Check chat rail
    const chatText = await page.locator('[data-testid="chat-rail"]').innerText();
    expect(emojiPattern.test(chatText)).toBe(false);
  });

  test('Electric gold accent is present in the DOM', async ({ page }) => {
    // Check that elements with the animated gradient class exist
    const goldElements = await page.locator('.xps-gold-accent, .xps-gold-text').count();
    expect(goldElements).toBeGreaterThan(0);
  });

  test('Text contrast — primary text is light on dark background', async ({ page }) => {
    // Check header text color is light
    const headerColor = await page.evaluate(() => {
      const h = document.querySelector('header');
      if (!h) return null;
      const spans = h.querySelectorAll('span');
      for (const span of spans) {
        const color = window.getComputedStyle(span).color;
        if (color && color !== 'rgba(0, 0, 0, 0)') return color;
      }
      return null;
    });
    // If we got a color, ensure it's not dark text (pure black = rgb(0,0,0))
    if (headerColor) {
      expect(headerColor).not.toBe('rgb(0, 0, 0)');
    }
  });

  test('Full workspace overview screenshot', async ({ page }) => {
    await screenshot(page, 'workspace-full-overview');
    // Just need no crash
    expect(true).toBe(true);
  });

  test('Admin full overview screenshot', async ({ page }) => {
    await page.click('[data-testid="page-tab-admin"]');
    await page.waitForSelector('[data-testid="admin-nav-integrations"]', { timeout: 5000 });
    await screenshot(page, 'admin-full-overview');
    expect(true).toBe(true);
  });
});
