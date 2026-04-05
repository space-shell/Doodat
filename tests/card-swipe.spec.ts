/**
 * US-003 — Completing a card
 * US-004 — Skipping a card
 */
import { test, expect } from '@playwright/test';
import { completeOnboarding } from './helpers';

/** Read a snapshot of the store state. */
async function getStoreState(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const store = (window as any).__dodaatStore;
    if (!store) return null;
    const s = store.getState();
    return {
      currentIndex: s.currentIndex,
      deckLength: s.deck?.length ?? 0,
      currentCardType: s.deck?.[s.currentIndex]?.type ?? null,
      outcomes: s.dailyState?.outcomes ?? [],
    };
  });
}

/** Call swipeCard on the store directly. */
async function storeSwipe(page: import('@playwright/test').Page, direction: 'complete' | 'skip') {
  await page.evaluate(async (dir) => {
    const store = (window as any).__dodaatStore;
    if (store) await store.getState().swipeCard(dir);
  }, direction);
  await page.waitForTimeout(200);
}

test.describe('Card swipe — complete (US-003)', () => {

  test('Swiping complete advances the deck index', async ({ page }) => {
    await completeOnboarding(page);

    const before = await getStoreState(page);
    expect(before).not.toBeNull();
    expect(before!.currentIndex).toBe(0);

    await storeSwipe(page, 'complete');

    const after = await getStoreState(page);
    expect(after!.currentIndex).toBe(1);
  });

  test('Completing a card records a "complete" outcome in daily state', async ({ page }) => {
    await completeOnboarding(page);

    const before = await getStoreState(page);
    expect(before!.outcomes).toHaveLength(0);

    await storeSwipe(page, 'complete');

    const after = await getStoreState(page);
    expect(after!.outcomes).toHaveLength(1);
    expect(after!.outcomes[0].swipeDirection).toBe('complete');
  });

  test('Completing multiple cards advances the index correctly', async ({ page }) => {
    await completeOnboarding(page);

    await storeSwipe(page, 'complete');
    await storeSwipe(page, 'complete');
    await storeSwipe(page, 'complete');

    const state = await getStoreState(page);
    expect(state!.currentIndex).toBe(3);
    expect(state!.outcomes).toHaveLength(3);
    expect(state!.outcomes.every((o: any) => o.swipeDirection === 'complete')).toBe(true);
  });

});

test.describe('Card swipe — skip (US-004)', () => {

  test('Skipping a card advances the deck index', async ({ page }) => {
    await completeOnboarding(page);

    await storeSwipe(page, 'skip');

    const after = await getStoreState(page);
    expect(after!.currentIndex).toBe(1);
  });

  test('Skipping a card records a "skip" outcome in daily state', async ({ page }) => {
    await completeOnboarding(page);

    await storeSwipe(page, 'skip');

    const after = await getStoreState(page);
    expect(after!.outcomes[0].swipeDirection).toBe('skip');
  });

  test('Fewer than 3 skips does not inject an accountability card', async ({ page }) => {
    await completeOnboarding(page);

    await storeSwipe(page, 'skip');
    await storeSwipe(page, 'skip');

    const state = await getStoreState(page);
    // Deck should not contain an accountability card at index 2
    const nextCardType = await page.evaluate(() => {
      const s = (window as any).__dodaatStore?.getState();
      return s?.deck?.[s.currentIndex]?.type ?? null;
    });
    expect(nextCardType).not.toBe('system_accountability');
  });

  test('Third skip injects an accountability card as the next card', async ({ page }) => {
    await completeOnboarding(page);

    await storeSwipe(page, 'skip');
    await storeSwipe(page, 'skip');
    await storeSwipe(page, 'skip');

    const injected = await page.evaluate(() => {
      const s = (window as any).__dodaatStore?.getState();
      return s?.deck?.[s.currentIndex]?.type ?? null;
    });
    expect(injected).toBe('system_accountability');
  });

});
