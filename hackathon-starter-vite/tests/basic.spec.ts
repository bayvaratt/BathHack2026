import { test, expect } from '../playwright-fixture';

test('basic test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/WanderDrop/);
});