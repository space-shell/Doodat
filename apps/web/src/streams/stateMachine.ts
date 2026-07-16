import { Observable, Subject, merge, scan } from 'rxjs';
import { map } from 'rxjs/operators';
import { reduce } from './reducer';
import { intent$ } from './intents';
import { dailyReset$ } from './time';
import type { AppState, Intent } from '../types';

/**
 * Intents produced by Nostr side-effects (boot fetch results, etc.). Distinct
 * from the UI `intent$` stream so the effect layer never feeds back into the
 * intents it observes. Merged into the state scan below.
 */
export const nostrResult$ = new Subject<Intent>();

/**
 * The application state stream. Merges UI intents, time-driven resets, and
 * Nostr-effect results, then scans the reducer over them, threading state from
 * `seed`.
 *
 * This observable IS the state — the store layer just bridges it to Solid
 * signals and persists slices to localStorage. Business logic lives entirely
 * in the reducer (pure), not here.
 */
export function state$(seed: AppState): Observable<AppState> {
  const dailyResets$: Observable<Intent> = dailyReset$().pipe(
    map((date): Intent => ({ type: 'DAILY_RESET', date })),
  );

  return merge(intent$, dailyResets$, nostrResult$).pipe(
    scan((state, intent) => reduce(state, intent), seed),
  );
}
