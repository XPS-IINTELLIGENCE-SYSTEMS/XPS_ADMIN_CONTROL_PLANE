import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS = path.join(__dirname, 'screenshots');

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS, `${name}.png`), fullPage: false });
}

async function signIn(page) {
  await page.goto('/');
  await page.waitForSelector('text=Welcome back');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByTestId('control-center')).toBeVisible();
}

test.describe('XPS Intelligence simplified control center', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('login page restores the branded front door', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByText('Use Sign In to enter the workspace shell.')).toBeVisible();
    await screenshot(page, 'login-front-door');
  });

  test('sign in opens the single-screen control center with persistent chat', async ({ page }) => {
    await signIn(page);
    await expect(page.getByTestId('control-center').getByText('Unified connectors', { exact: true })).toBeVisible();
    await expect(page.getByTestId('control-center').getByText('Access and sign-in', { exact: true })).toBeVisible();
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await expect(page.getByText('Persistent chat is live on the right.')).toBeVisible();
    await screenshot(page, 'control-center-shell');
  });

  test('workspace quick actions create editable outputs', async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: /Daily brief Create a short editable status brief for today\./ }).click();
    await expect(page.getByText('Review the hottest leads')).toBeVisible();
    await expect(page.getByText('Confirm connector health')).toBeVisible();
    await screenshot(page, 'workspace-quick-action');
  });

  test('connectors are centralized and support add modify delete', async ({ page }) => {
    await signIn(page);
    await page.locator('aside').getByRole('button', { name: 'Connectors' }).click();

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

  test('chat creates a connector-focused response and keeps the rail pinned right', async ({ page }) => {
    await signIn(page);
    await page.getByTestId('model-selector').selectOption('connectors');
    await page.getByTestId('chat-input').fill('Show me the connector changes I need to make today.');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText('Add or remove custom connectors from the same screen').first()).toBeVisible();
    await expect(page.getByTestId('control-center').getByText('Unified connectors', { exact: true })).toBeVisible();
  });

  test('access actions return to sign in and open real external sign-in pages', async ({ page }) => {
    await signIn(page);
    await page.locator('aside').getByRole('button', { name: 'Access' }).click();

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
    await page.getByRole('banner').getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Welcome back')).toBeVisible();
  });
});
