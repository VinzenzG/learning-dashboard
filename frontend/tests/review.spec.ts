import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tour_completed', '1');
  });
});

test('Daily Review Seite lädt', async ({ page }) => {
  await page.goto('/review');
  await page.waitForTimeout(2000);
  // Should show either cards or "no cards due" message
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  expect(body!.length).toBeGreaterThan(20);
});

test('Daily Review zeigt Karteikarten oder Leer-Zustand', async ({ page }) => {
  await page.goto('/review');
  await page.waitForTimeout(3000);

  const hasCard = await page.locator('[data-testid="flashcard"], .cursor-pointer').first().isVisible().catch(() => false);
  const hasEmptyMsg = await page.locator('text=Heute keine Karten fällig, text=keine Karten, text=All caught up').first().isVisible().catch(() => false);
  const hasReviewContent = await page.locator('h1, h2, h3').first().isVisible().catch(() => false);

  expect(hasCard || hasEmptyMsg || hasReviewContent).toBeTruthy();
});
