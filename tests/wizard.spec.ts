import { test, expect, Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Reset app to first-launch state by wiping localStorage and reloading. */
async function freshLaunch(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // Wait for the app to initialise (spinner → welcome card)
  await expect(page.getByText('do one day at a time')).toBeVisible({ timeout: 10000 });
}

/** Click the primary action button on the current card ("Begin →", "Confirm →", "Start →"). */
async function confirmCard(page: Page) {
  const btn = page.getByText(/^(Begin|Confirm|Start)\s*→$/);
  await expect(btn).toBeVisible();
  await btn.click();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Onboarding wizard', () => {

  test('Step 1 — Welcome card shows the dodaat tagline and Begin button', async ({ page }) => {
    await freshLaunch(page);

    await expect(page.getByText('dodaat').first()).toBeVisible();
    await expect(page.getByText('do one day at a time')).toBeVisible();
    await expect(page.getByText('This is a daily ritual.')).toBeVisible();
    await expect(page.getByText('Each day, you receive nine cards.')).toBeVisible();
    await expect(page.getByText('Swipe right when you are done.')).toBeVisible();
    await expect(page.getByText('Swipe left to skip.')).toBeVisible();
    await expect(page.getByText(/^Begin\s*→$/)).toBeVisible();
  });

  test('Step 2 — Physical preferences card appears after Begin', async ({ page }) => {
    await freshLaunch(page);
    await confirmCard(page);

    await expect(page.getByText('Physical Preferences')).toBeVisible();
    await expect(page.getByText('FOCUS AREAS')).toBeVisible();
    // All focus area options are present
    for (const label of ['Upper Body', 'Lower Body', 'Full Body', 'Flexibility', 'Cardio']) {
      await expect(page.getByText(label)).toBeVisible();
    }
    await expect(page.getByText('INTERESTED IN FASTING?')).toBeVisible();
    await expect(page.getByText(/^Confirm\s*→$/)).toBeVisible();
  });

  test('Step 2 — Can select physical focus areas and toggle fasting', async ({ page }) => {
    await freshLaunch(page);
    await confirmCard(page);

    // Select two focus areas
    await page.getByText('Upper Body').click();
    await page.getByText('Cardio').click();

    // Toggle the fasting switch — custom component, just verify it's interactive
    const fastingSwitch = page.getByRole('switch');
    await expect(fastingSwitch).toBeVisible();
    await fastingSwitch.click(); // should not throw

    // Can still proceed
    await expect(page.getByText(/^Confirm\s*→$/)).toBeVisible();
  });

  test('Step 3 — Mental preferences card appears after Physical confirm', async ({ page }) => {
    await freshLaunch(page);
    await confirmCard(page); // Welcome → Physical
    await confirmCard(page); // Physical → Mental

    await expect(page.getByText('Mental Preferences')).toBeVisible();
    await expect(page.getByText('AREAS TO WORK ON')).toBeVisible();
    for (const label of ['Focus', 'Anxiety', 'Creativity', 'Discipline']) {
      await expect(page.getByText(label)).toBeVisible();
    }
    await expect(page.getByText('COMFORTABLE WITH WRITING?')).toBeVisible();
  });

  test('Step 4 — Spiritual preferences card appears after Mental confirm', async ({ page }) => {
    await freshLaunch(page);
    await confirmCard(page); // Welcome
    await confirmCard(page); // Physical
    await confirmCard(page); // Mental → Spiritual

    await expect(page.getByText('Spiritual Preferences')).toBeVisible();
    await expect(page.getByText('SECULAR ←→ TRADITION-SPECIFIC')).toBeVisible();
    await expect(page.getByText('TRADITIONS (OPTIONAL)')).toBeVisible();
    for (const tradition of ['Christianity', 'Islam', 'Buddhism', 'Hinduism', 'Stoicism']) {
      await expect(page.getByText(tradition)).toBeVisible();
    }
  });

  test('Step 5 — Intensity selection card appears after Spiritual confirm', async ({ page }) => {
    await freshLaunch(page);
    await confirmCard(page); // Welcome
    await confirmCard(page); // Physical
    await confirmCard(page); // Mental
    await confirmCard(page); // Spiritual → Intensity

    await expect(page.getByText("This week's intensity")).toBeVisible();
    await expect(page.getByText('Choose how hard to push this week.')).toBeVisible();

    // All three intensity levels are present with descriptions
    await expect(page.getByText('Low')).toBeVisible();
    await expect(page.getByText('Medium').first()).toBeVisible();
    await expect(page.getByText('High')).toBeVisible();
    await expect(page.getByText(/Minimum viable/)).toBeVisible();
    await expect(page.getByText(/Moderate effort/)).toBeVisible();
    await expect(page.getByText(/Maximum effort/)).toBeVisible();
  });

  test('Step 5 — Can select an intensity level', async ({ page }) => {
    await freshLaunch(page);
    await confirmCard(page);
    await confirmCard(page);
    await confirmCard(page);
    await confirmCard(page);

    // Select High intensity
    await page.getByText('High').click();
    await expect(page.getByText(/^Confirm\s*→$/)).toBeVisible();
  });

  test('Step 6 — All Set card appears after Intensity confirm', async ({ page }) => {
    await freshLaunch(page);
    await confirmCard(page); // Welcome
    await confirmCard(page); // Physical
    await confirmCard(page); // Mental
    await confirmCard(page); // Spiritual
    await page.getByText('Medium').first().click();
    await confirmCard(page); // Intensity → All Set

    await expect(page.getByText('All set.')).toBeVisible();
    await expect(page.getByText('Your first deck is ready.')).toBeVisible();
    await expect(page.getByText(/showing up, one day at a time/)).toBeVisible();
    await expect(page.getByText(/^Start\s*→$/)).toBeVisible();
  });

  test('Full wizard — completes onboarding and lands on the daily deck', async ({ page }) => {
    await freshLaunch(page);

    // Step 1: Welcome
    await confirmCard(page);

    // Step 2: Physical — pick Full Body
    await expect(page.getByText('Physical Preferences')).toBeVisible();
    await page.getByText('Full Body').click();
    await confirmCard(page);

    // Step 3: Mental — pick Focus and Discipline
    await expect(page.getByText('Mental Preferences')).toBeVisible();
    await page.getByText('Focus').click();
    await page.getByText('Discipline').click();
    await confirmCard(page);

    // Step 4: Spiritual — pick Stoicism
    await expect(page.getByText('Spiritual Preferences')).toBeVisible();
    await page.getByText('Stoicism').click();
    await confirmCard(page);

    // Step 5: Intensity — pick Medium
    await expect(page.getByText("This week's intensity")).toBeVisible();
    await page.getByText('Medium').first().click();
    await confirmCard(page);

    // Step 6: All Set
    await expect(page.getByText('All set.')).toBeVisible();
    await confirmCard(page); // Start →

    // Should now be on the daily deck (no more wizard cards)
    await expect(page.getByText('Physical Preferences')).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Mental Preferences')).not.toBeVisible();
    await expect(page.getByText("This week's intensity")).not.toBeVisible();
    // Header should still show app name
    await expect(page.getByText('dodaat').first()).toBeVisible();
  });

  test('Returning user — skips wizard and goes straight to daily deck', async ({ page }) => {
    // First, complete the full wizard
    await freshLaunch(page);
    await confirmCard(page);
    await confirmCard(page);
    await confirmCard(page);
    await confirmCard(page);
    await page.getByText('Medium').first().click();
    await confirmCard(page);
    await confirmCard(page); // Start →

    // Wait for onboardingComplete to be persisted before reloading
    await page.waitForFunction(() => {
      try {
        const profile = JSON.parse(localStorage.getItem('dodaat_user_profile') ?? '{}');
        return profile.onboardingComplete === true;
      } catch { return false; }
    }, { timeout: 5000 });

    // Reload without clearing storage — simulates returning user
    await page.reload();
    await page.waitForTimeout(2000);

    // Wizard-specific cards must not appear
    await expect(page.getByText(/^Begin\s*→$/)).not.toBeVisible();
    await expect(page.getByText('Physical Preferences')).not.toBeVisible();
    await expect(page.getByText('Mental Preferences')).not.toBeVisible();
    await expect(page.getByText("This week's intensity")).not.toBeVisible();
    // App header is still present
    await expect(page.getByText('dodaat').first()).toBeVisible();
  });

});
