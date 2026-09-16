import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tour_completed', '1');
  });
});

test('Prüfungsmodus Seite lädt', async ({ page }) => {
  await page.goto('/exam');
  await page.waitForTimeout(2000);
  await expect(page.locator('body')).toBeVisible();
  const body = await page.textContent('body');
  expect(body!.length).toBeGreaterThan(20);
});

test('Prüfungsmodus zeigt Modul-Auswahl oder Exam-Inhalt', async ({ page }) => {
  await page.goto('/exam');
  await page.waitForTimeout(3000);

  // Check any exam-related text is present
  const hasPruefung = await page.getByText('Prüfung').first().isVisible().catch(() => false);
  const hasModul = await page.getByText('Modul').first().isVisible().catch(() => false);
  const hasExam = await page.getByText('Exam').first().isVisible().catch(() => false);
  expect(hasPruefung || hasModul || hasExam).toBeTruthy();
});
