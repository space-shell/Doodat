import { Subscription, type Observable } from 'rxjs';
import { filter, withLatestFrom } from 'rxjs/operators';
import { SimplePool, finalizeEvent } from 'nostr-tools';
import { intent$ } from './intents';
import { nostrResult$ } from './stateMachine';
import { buildDailyDeck } from './reducer';
import { FLAGS } from '../config/flags';
import { loadKeyPair, secretKeyToBytes, type KeyPair } from '../nostr/keys';
import {
  fetchDayTasks,
  publishDayTask,
  DEFAULT_RELAYS,
} from '../nostr/relay';
import { DAY_TASK_KIND } from '../nostr/events';
import {
  deckFromDayTasks,
  outcomesFromDayTasks,
  dealToPublishList,
} from '../nostr/sync';
import { todayString } from '@doodat/cards';
import type { AppState, Intent } from '../types';
import type { DeckCard } from '../types';

const BOOT_TIMEOUT_MS = 15_000;
const MIN_BOOT_DISPLAY_MS = 3_000;
const PUBLISH_MAXWAIT_MS = 5_000;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Index of a card among the content cards of a deck (its `order`). */
function orderInDeck(deck: DeckCard[], cardId: string): number {
  let order = 0;
  for (const c of deck) {
    if (c.type !== 'content') {
      if (c.id === cardId) return order;
      continue;
    }
    if (c.id === cardId) return order;
    order++;
  }
  return order;
}

/** True if the pool has at least one live relay connection. */
function anyRelayConnected(pool: SimplePool): boolean {
  for (const ok of pool.listConnectionStatus().values()) if (ok) return true;
  return false;
}

/**
 * Wire Nostr side-effects: boot fetch, publish on deal, republish on complete,
 * delete on reset. Entirely inert when NOSTR_IDENTITY is off, and when no key
 * exists yet (onboarding will generate one). Results flow into `nostrResult$`;
 * the reducer is never touched directly. Returns a Subscription the store owns.
 *
 * `seed` is read directly for the one-shot boot check (state$ does not emit the
 * seed synchronously).
 */
export function wireNostrEffects(state$: Observable<AppState>, seed: AppState): Subscription {
  const sub = new Subscription();
  if (!FLAGS.NOSTR_IDENTITY) return sub;

  const key = loadKeyPair();
  if (!key) return sub;

  const pool = new SimplePool();

  // Boot: fetch today's tasks once onboarding is complete.
  if (seed.profile.onboardingComplete) void bootFetch(pool, key, seed.daily.date);

  // Originator: publish the dealt deck when intensity is selected. The deck is
  // recomputed here (mirroring the reducer) because withLatestFrom can't be
  // relied on to deliver the post-deal state synchronously.
  sub.add(
    intent$
      .pipe(
        filter((i): i is Extract<Intent, { type: 'SET_INTENSITY' }> => i.type === 'SET_INTENSITY'),
        withLatestFrom(state$),
      )
      .subscribe(([i, s]) => void publishDealtTasks(pool, key, s, i.intensity)),
  );

  // Republish a task as done when completed (pre-state is sufficient: deck
  // order and intensity don't change on swipe).
  sub.add(
    intent$
      .pipe(
        filter((i): i is Extract<Intent, { type: 'SWIPE' }> => i.type === 'SWIPE'),
        withLatestFrom(state$),
      )
      .subscribe(([i, s]) => {
        void publishDayTask(pool, DEFAULT_RELAYS, key.sk, s.daily.date, i.card.id, {
          status: 'done',
          order: orderInDeck(s.deck, i.card.id),
          intensity: s.profile.currentIntensity,
        });
      }),
  );

  // Reset to wizard: delete the day's tasks by address (NIP-09). Capture the
  // pre-reset deck (the reducer clears it on the same intent).
  sub.add(
    intent$
      .pipe(
        filter((i): i is Extract<Intent, { type: 'RESET_DAY_TO_WIZARD' }> => i.type === 'RESET_DAY_TO_WIZARD'),
        withLatestFrom(state$),
      )
      .subscribe(([, s]) => void deleteDayTasks(pool, key, s.daily.date, s.deck)),
  );

  return sub;
}

async function bootFetch(pool: SimplePool, key: KeyPair, date: string): Promise<void> {
  try {
    const [tasks] = await Promise.all([
      fetchDayTasks(pool, DEFAULT_RELAYS, key.pk, date, BOOT_TIMEOUT_MS),
      delay(MIN_BOOT_DISPLAY_MS), // min-3s ritual loading display
    ]);

    // No tasks AND no relay connection → treat as offline/error, not "empty day".
    if (tasks.length === 0 && !anyRelayConnected(pool)) {
      nostrResult$.next({ type: 'SET_BOOT_PHASE', phase: 'error' });
      return;
    }

    if (tasks.length > 0) {
      nostrResult$.next({
        type: 'LOAD_DAY_TASKS',
        date,
        deck: deckFromDayTasks(tasks, date),
        outcomes: outcomesFromDayTasks(tasks),
      });
    } else {
      // No tasks → this device is the originator: proceed to intensity prompt.
      nostrResult$.next({ type: 'SET_BOOT_PHASE', phase: 'ready' });
    }
  } catch {
    nostrResult$.next({ type: 'SET_BOOT_PHASE', phase: 'error' });
  }
}

async function publishDealtTasks(
  pool: SimplePool,
  key: KeyPair,
  s: AppState,
  intensity: AppState['profile']['currentIntensity'],
): Promise<void> {
  const date = todayString();
  // Recompute the dealt deck (mirrors handleSetIntensity) to publish exactly
  // what the reducer dealt, without depending on state$ timing.
  const dealtProfile = {
    ...s.profile,
    currentIntensity: intensity,
    intensitySetAt: Date.now(),
    onboardingComplete: true,
  };
  const deck = buildDailyDeck(dealtProfile, date, s.recentCardIds);
  const list = dealToPublishList(deck);
  await Promise.all(
    list.map(({ taskId, order }) =>
      publishDayTask(pool, DEFAULT_RELAYS, key.sk, date, taskId, {
        status: 'todo',
        order,
        intensity,
      }),
    ),
  );
}

async function deleteDayTasks(
  pool: SimplePool,
  key: KeyPair,
  date: string,
  deck: DeckCard[],
): Promise<void> {
  const taskIds = deck.filter((c) => c.type === 'content').map((c) => c.id);
  if (taskIds.length === 0) return;
  const tmpl = {
    kind: 5,
    tags: taskIds.map((id) => ['a', `${DAY_TASK_KIND}:${key.pk}:${date}:${id}`]),
    content: '',
    created_at: Math.floor(Date.now() / 1000),
  };
  const signed = finalizeEvent(tmpl, secretKeyToBytes(key.sk));
  const results = await pool.publish(DEFAULT_RELAYS, signed, { maxWait: PUBLISH_MAXWAIT_MS });
  await Promise.allSettled(results);
}
