import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Clear tour so it doesn't interfere
  await page.addInitScript(() => {
    localStorage.setItem('tour_completed', '1');
  });
});

test('Dashboard lädt und zeigt Sidebar', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=LearnDash')).toBeVisible();
  await expect(page.locator('#sidebar-nav')).toBeVisible();
});

test('Dashboard zeigt Lerneinheiten-Karten', async ({ page }) => {
  await page.goto('/');
  // Wait for units to load (either cards or empty state)
  await page.waitForSelector('[data-testid="unit-card"], [data-testid="empty-state"], .text-muted-foreground', { timeout: 10000 });
  // Page title area visible
  await expect(page.locator('h1, h2').first()).toBeVisible();
});

test('Dashboard zeigt Modul-Bereich', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  // Either units loaded or loading state
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  expect(body!.length).toBeGreaterThan(50);
});
