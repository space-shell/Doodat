/**
 * US-006 — Weekly intensity selection
 */
import { test, expect, Page } from '@playwright/test';
import { completeOnboarding } from './helpers';

/** Simulate a new-week scenario by backdating intensitySetAt in localStorage. */
async function backdateIntensity(page: Page) {
  await page.evaluate(() => {
    const raw = localStorage.getItem('dodaat_user_profile');
    if (!raw) return;
    const profile = JSON.parse(raw);
    // Set intensitySetAt to a date 8 days ago (guaranteed previous ISO week)
    profile.intensitySetAt = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem('dodaat_user_profile', JSON.stringify(profile));
  });
}

test.describe('Weekly intensity selection (US-006)', () => {

  test('Intensity card does not appear during the same week onboarding was completed', async ({ page }) => {
    await completeOnboarding(page);

    // Reload — same week, intensity already set
    await page.reload();
    await page.waitForTimeout(2000);

    await expect(page.getByText("This week's intensity")).not.toBeVisible();
  });

  test('Intensity card appears on first load of a new ISO week', async ({ page }) => {
    await completeOnboarding(page);
    await backdateIntensity(page);

    // Reload with stale intensity
    await page.reload();
    await page.waitForTimeout(2000);

    await expect(page.getByText("This week's intensity")).toBeVisible();
    await expect(page.getByText('Low', { exact: true })).toBeVisible();
    await expect(page.getByText('Medium').first()).toBeVisible();
    await expect(page.getByText('High')).toBeVisible();
  });

  test('Selecting an intensity and confirming dismisses the intensity card', async ({ page }) => {
    await completeOnboarding(page);
    await backdateIntensity(page);
    await page.reload();
    await page.waitForTimeout(2000);

    await expect(page.getByText("This week's intensity")).toBeVisible();
    await page.getByText('High').click();
    await page.getByText(/^Confirm\s*→$/).click();

    await expect(page.getByText("This week's intensity")).not.toBeVisible({ timeout: 3000 });
  });

  test('Intensity selection persists — card does not reappear on same-week reload', async ({ page }) => {
    await completeOnboarding(page);
    await backdateIntensity(page);
    await page.reload();
    await page.waitForTimeout(2000);

    // Select and confirm intensity
    await page.getByText('Low', { exact: true }).click();
    await page.getByText(/^Confirm\s*→$/).click();

    // Wait for it to be saved
    await page.waitForFunction(() => {
      try {
        const p = JSON.parse(localStorage.getItem('dodaat_user_profile') ?? '{}');
        return p.currentIntensity === 'low' && p.intensitySetAt > Date.now() - 5000;
      } catch { return false; }
    }, { timeout: 5000 });

    // Reload again — intensity card must not appear
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page.getByText("This week's intensity")).not.toBeVisible();
  });

  test('Footer reflects the selected intensity level', async ({ page }) => {
    await completeOnboarding(page);

    // After completing onboarding with Medium, footer shows "Medium Intensity This Week"
    await expect(page.getByText(/Medium/i).first()).toBeVisible();
    await expect(page.getByText(/Intensity This Week/i)).toBeVisible();
  });

});
