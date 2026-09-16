import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tour_completed', '1');
  });
});

test('Navigation: Daily Review', async ({ page }) => {
  await page.goto('/');
  await page.click('#nav-review');
  await expect(page).toHaveURL(/.*review/);
  await page.waitForTimeout(1000);
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
});

test('Navigation: Prüfungsmodus', async ({ page }) => {
  await page.goto('/');
  await page.click('#nav-exam');
  await expect(page).toHaveURL(/.*exam/);
  await page.waitForTimeout(1000);
  await expect(page.locator('body')).toBeVisible();
});

test('Navigation: Analytics', async ({ page }) => {
  await page.goto('/');
  await page.click('#nav-analytics');
  await expect(page).toHaveURL(/.*analytics/);
  await page.waitForTimeout(1000);
  await expect(page.locator('body')).toBeVisible();
});

test('Navigation: Achievements', async ({ page }) => {
  await page.goto('/');
  await page.click('#nav-achievements');
  await expect(page).toHaveURL(/.*achievements/);
  await page.waitForTimeout(1000);
  await expect(page.locator('body')).toBeVisible();
});

test('Navigation: Settings', async ({ page }) => {
  await page.goto('/');
  await page.click('#nav-settings');
  await expect(page).toHaveURL(/.*settings/);
  await expect(page.locator('text=Einstellungen')).toBeVisible();
});

test('Navigation: Guide', async ({ page }) => {
  await page.goto('/');
  await page.click('#nav-guide');
  await expect(page).toHaveURL(/.*guide/);
  await expect(page.locator('text=Klick-Through-Guide')).toBeVisible();
});
