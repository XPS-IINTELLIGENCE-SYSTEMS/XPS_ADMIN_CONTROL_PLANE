import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS = path.join(__dirname, 'screenshots');

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS, `${name}.png`), fullPage: false });
}

async function signIn(page, options = {}) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForSelector('text=Welcome back');
  await page.getByPlaceholder('you@xpsxpress.com').fill('alex@xpsxpress.com');
  await page.getByPlaceholder('Any password works').fill('demo-password');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByTestId('control-center')).toBeVisible();
  if (!options.mobile) {
    await expect(page.getByTestId('chat-rail')).toBeVisible();
  }
}

test.describe('XPS Intelligence control plane shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('landing page restores the branded front door', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'XPS Intelligence' })).toBeVisible();
    await expect(page.getByText('Locations')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
    await screenshot(page, 'landing-front-door');
  });

  test('sign in opens the three-panel shell', async ({ page }) => {
    await signIn(page);
    await expect(page.getByTestId('control-center').getByText('Ingestion queue', { exact: true })).toBeVisible();
    await expect(page.getByTestId('chat-rail').getByTestId('chat-input')).toBeVisible();
    await screenshot(page, 'three-panel-shell');
  });

  test('workspace quick actions create editable outputs', async ({ page }) => {
    await signIn(page);
    await page.getByRole('banner').getByRole('button', { name: 'Workspace' }).click();
    await page.getByRole('button', { name: /Daily brief Create a short editable status brief for today\./ }).click();
    await expect(page.getByText('Review the hottest leads')).toBeVisible();
    await expect(page.getByText('Confirm connector health')).toBeVisible();
    await screenshot(page, 'workspace-quick-action');
  });

  test('connectors are centralized and support add modify delete', async ({ page }) => {
    await signIn(page);
    await page.getByRole('banner').getByRole('button', { name: 'Connectors' }).click();

    await page.getByTestId('custom-connector-name').fill('Slack Alerts');
    await page.getByTestId('custom-connector-endpoint').fill('https://hooks.slack.test/services/initial');
    await page.getByRole('button', { name: 'Add connector' }).last().click();
    await expect(page.getByText('Slack Alerts')).toBeVisible();

    await page.getByLabel('Edit connector').click();
    await page.getByTestId('custom-connector-endpoint').fill('https://hooks.slack.test/services/updated');
    await page.getByRole('button', { name: 'Modify connector' }).click();
    await expect(page.getByText('https://hooks.slack.test/services/updated')).toBeVisible();

    await page.getByLabel('Delete connector').click();
    await expect(page.getByText('Custom connector deleted.')).toBeVisible();
    await expect(page.getByText('Slack Alerts')).toHaveCount(0);
    await screenshot(page, 'connectors-crud');
  });

  test('chat attachments sync into the dashboard queue', async ({ page }) => {
    await signIn(page);
    await page.locator('[data-testid="chat-rail"] input[type="file"]').setInputFiles({
      name: 'xps-queue.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('xps queue test'),
    });

    await expect(page.getByTestId('chat-rail-panel').getByText('xps-queue.pdf')).toBeVisible();
    await expect(page.getByTestId('control-center').getByText('xps-queue.pdf')).toBeVisible();
    await expect(page.getByTestId('control-center').getByText('Queue ready')).toBeVisible();
  });

  test('access actions return to sign in and open real external sign-in pages', async ({ page }) => {
    await signIn(page);
    await page.getByRole('banner').getByRole('button', { name: 'Access' }).click();

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: 'Open sign-in page' }).first().click(),
    ]);
    await expect(popup).toHaveURL(/github\.com\/login/);
    await popup.close();

    await page.getByRole('button', { name: 'Open sign-in screen' }).click();
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('header sign in button always returns to the login screen', async ({ page }) => {
    await signIn(page);
    await page.getByRole('banner').getByRole('button', { name: 'Sign In' }).last().click();
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('mobile opens the chat rail over the centered dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, { mobile: true });
    await expect(page.getByRole('banner').getByRole('button', { name: /show chat rail/i })).toBeVisible();
    await page.getByRole('banner').getByRole('button', { name: /show chat rail/i }).click();
    await expect(page.getByTestId('chat-rail').getByTestId('chat-input')).toBeVisible();
    await expect(page.getByTestId('control-center')).toBeVisible();
  });
});
