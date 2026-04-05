/**
 * US-005 — Accountability prompt
 */
import { test, expect, Page } from '@playwright/test';
import { completeOnboarding } from './helpers';

async function storeSwipe(page: Page, direction: 'complete' | 'skip') {
  await page.evaluate(async (dir) => {
    const store = (window as any).__dodaatStore;
    if (store) await store.getState().swipeCard(dir);
  }, direction);
  await page.waitForTimeout(200);
}

async function getCurrentDeckCard(page: Page) {
  return page.evaluate(() => {
    const s = (window as any).__dodaatStore?.getState();
    if (!s) return null;
    return {
      type: s.deck?.[s.currentIndex]?.type ?? null,
      index: s.currentIndex,
      deckLength: s.deck?.length ?? 0,
    };
  });
}

test.describe('Accountability prompt (US-005)', () => {

  test('No accountability card after 1 skip', async ({ page }) => {
    await completeOnboarding(page);
    await storeSwipe(page, 'skip');

    const card = await getCurrentDeckCard(page);
    expect(card?.type).not.toBe('system_accountability');
  });

  test('No accountability card after 2 skips', async ({ page }) => {
    await completeOnboarding(page);
    await storeSwipe(page, 'skip');
    await storeSwipe(page, 'skip');

    const card = await getCurrentDeckCard(page);
    expect(card?.type).not.toBe('system_accountability');
  });

  test('Accountability card is injected after exactly 3 skips', async ({ page }) => {
    await completeOnboarding(page);
    await storeSwipe(page, 'skip');
    await storeSwipe(page, 'skip');
    await storeSwipe(page, 'skip');

    const card = await getCurrentDeckCard(page);
    expect(card?.type).toBe('system_accountability');
  });

  test('Accountability card is not injected again after already being shown', async ({ page }) => {
    await completeOnboarding(page);

    // Trigger 3 skips to inject accountability card
    await storeSwipe(page, 'skip');
    await storeSwipe(page, 'skip');
    await storeSwipe(page, 'skip');

    // Skip the accountability card itself
    await storeSwipe(page, 'complete');

    // Skip 3 more — should NOT inject another accountability card
    await storeSwipe(page, 'skip');
    await storeSwipe(page, 'skip');
    await storeSwipe(page, 'skip');

    const card = await getCurrentDeckCard(page);
    expect(card?.type).not.toBe('system_accountability');
  });

  test('Deck length increases by 1 when accountability card is injected', async ({ page }) => {
    await completeOnboarding(page);

    const before = await getCurrentDeckCard(page);
    const lengthBefore = before?.deckLength ?? 0;

    await storeSwipe(page, 'skip');
    await storeSwipe(page, 'skip');
    await storeSwipe(page, 'skip');

    const after = await getCurrentDeckCard(page);
    expect(after?.deckLength).toBe(lengthBefore + 1);
  });

});
