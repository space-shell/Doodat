import { Page, expect } from '@playwright/test';

// ─── App lifecycle ─────────────────────────────────────────────────────────────

/** Complete the full onboarding wizard with default selections. */
export async function completeOnboarding(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText('do one day at a time')).toBeVisible({ timeout: 10000 });

  // Welcome
  await page.getByText(/^Begin\s*→$/).click();
  // Physical
  await expect(page.getByText('Physical Preferences')).toBeVisible();
  await page.getByText('Full Body').click();
  await page.getByText(/^Confirm\s*→$/).click();
  // Mental
  await expect(page.getByText('Mental Preferences')).toBeVisible();
  await page.getByText('Focus').click();
  await page.getByText(/^Confirm\s*→$/).click();
  // Spiritual
  await expect(page.getByText('Spiritual Preferences')).toBeVisible();
  await page.getByText(/^Confirm\s*→$/).click();
  // Intensity
  await expect(page.getByText("This week's intensity")).toBeVisible();
  await page.getByText('Medium').first().click();
  await page.getByText(/^Confirm\s*→$/).click();
  // All set
  await expect(page.getByText('All set.')).toBeVisible();
  await page.getByText(/^Start\s*→$/).click();

  // Wait for onboardingComplete to persist
  await page.waitForFunction(() => {
    try {
      return JSON.parse(localStorage.getItem('dodaat_user_profile') ?? '{}').onboardingComplete === true;
    } catch { return false; }
  }, { timeout: 5000 });
}

/** Simulate a rightward swipe (complete) on the top card via mouse drag. */
export async function swipeRight(page: Page) {
  const card = page.locator('[data-testid="swipeable-card"]').first();
  // Fall back to centre of viewport if test id not found
  const box = await card.boundingBox().catch(() => null);
  const vp = page.viewportSize()!;
  const cx = box ? box.x + box.width / 2 : vp.width / 2;
  const cy = box ? box.y + box.height / 2 : vp.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + vp.width * 0.5, cy, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(400); // animation settle
}

/** Simulate a leftward swipe (skip) on the top card via mouse drag. */
export async function swipeLeft(page: Page) {
  const vp = page.viewportSize()!;
  const cx = vp.width / 2;
  const cy = vp.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx - vp.width * 0.5, cy, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(400);
}

/** Advance the deck N cards by directly calling swipeCard on the store via page.evaluate. */
export async function advanceDeck(page: Page, count: number, direction: 'complete' | 'skip' = 'complete') {
  for (let i = 0; i < count; i++) {
    await page.evaluate(async (dir) => {
      // Access zustand store via the window-exposed handle set in tests
      const store = (window as any).__doodaatStore;
      if (store) await store.getState().swipeCard(dir);
    }, direction);
    await page.waitForTimeout(150);
  }
}
