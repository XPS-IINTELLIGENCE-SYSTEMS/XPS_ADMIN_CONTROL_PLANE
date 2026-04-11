import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS = path.join(__dirname, 'screenshots');

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS, `${name}.png`), fullPage: false });
}

test.describe('XPS Intelligence site restore', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Welcome back');
  });

  test('login page restores the branded front door', async ({ page }) => {
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByText('Use Sign In to enter the workspace shell.')).toBeVisible();
    await screenshot(page, 'login-front-door');
  });

  test('sign in opens the workspace shell directly', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('banner').getByRole('button', { name: 'Workspace' })).toBeVisible();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    await expect(page.getByText('UI Editor Canvas').first()).toBeVisible();
  });

  test('top navigation can switch from workspace to dashboard', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.locator('aside').first()).toBeVisible();
    await page.getByRole('button', { name: 'Dashboard' }).first().click();
    await expect(page.getByRole('banner').getByRole('button', { name: 'Dashboard' })).toBeVisible();
    await expect(page.locator('[data-testid="brand-logo-header"]')).toBeVisible();
    await screenshot(page, 'dashboard-shell');
  });

  test('sidebar only shows intended product pages', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toContainText('Workspace');
    await expect(sidebar).toContainText('Dashboard');
    await expect(sidebar).toContainText('CRM');
    await expect(sidebar).toContainText('Knowledge Base');
    await expect(sidebar).toContainText('Competition');
    await expect(sidebar).toContainText('Connectors');
    await expect(sidebar).not.toContainText('ByteBot');
    await expect(sidebar).not.toContainText('Admin Control Plane');
    await expect(sidebar).not.toContainText('Quarantine');
  });

  test('core workflow pages remain usable', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.locator('aside').getByRole('button', { name: 'CRM' }).click();
    await expect(page.getByText('CRM Dashboard')).toBeVisible();

    await page.locator('aside').getByRole('button', { name: 'Leads' }).click();
    await expect(page.getByText('Lead Intelligence')).toBeVisible();

    await page.locator('aside').getByRole('button', { name: 'Research Lab' }).click();
    await expect(page.getByRole('heading', { name: 'Research Lab' })).toBeVisible();

    await page.locator('aside').getByRole('button', { name: 'Outreach' }).click();
    await expect(page.getByText('Active Sequences')).toBeVisible();

    await page.locator('aside').getByRole('button', { name: 'Proposals' }).click();
    await expect(page.getByText('Active Proposals')).toBeVisible();

    await page.locator('aside').getByRole('button', { name: 'Analytics' }).click();
    await expect(page.getByText('Performance Summary')).toBeVisible();
  });

  test('workspace keeps the chat rail and editor visible', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="attach-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="model-selector"]')).toBeVisible();
    await expect(page.getByText('UI Editor Canvas').first()).toBeVisible();
    await screenshot(page, 'workspace-shell');
  });

  test('connectors page is centralized and cleaner', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.locator('aside').getByRole('button', { name: 'Connectors' }).click();
    await expect(page.getByText('Routing defaults')).toBeVisible();
    await expect(page.getByText('AI providers')).toBeVisible();
    await expect(page.getByText('Business systems')).toBeVisible();
    await screenshot(page, 'connectors-clean');
  });

  test('admin page is smaller and still useful', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.locator('aside').getByRole('button', { name: 'Admin' }).click();
    await expect(page.getByText('Focused runtime, access, and governance controls')).toBeVisible();
    await expect(page.locator('[data-testid="active-provider-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-google-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-github-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-email-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-refresh-status"]')).toBeVisible();
    await screenshot(page, 'admin-clean');
  });

  test('settings centralize defaults and reset actions', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.locator('aside').getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByText('Workspace defaults', { exact: true })).toBeVisible();
    await expect(page.getByText('Credential readiness', { exact: true })).toBeVisible();
    await expect(page.getByText('Reset clutter')).toBeVisible();
    await screenshot(page, 'settings-clean');
  });

  test('home button returns to the landing page', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByRole('button', { name: 'Home' }).click();
    await expect(page.getByText('Choose where to go next')).toBeVisible();
  });

  test('branding stays black and gold with no white screen', async ({ page }) => {
    const bg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe('rgb(255, 255, 255)');
    await expect(page.locator('.xps-gold-text').first()).toBeVisible();
  });
});
