import { Observable, merge, scan } from 'rxjs';
import { map } from 'rxjs/operators';
import { reduce } from './reducer';
import { intent$ } from './intents';
import { dailyReset$ } from './time';
import type { AppState, Intent } from '../types';

/**
 * The application state stream. Merges UI intents with time-driven resets,
 * then scans the reducer over them, threading state from `seed`.
 *
 * This observable IS the state — the store layer just bridges it to Solid
 * signals and persists slices to localStorage. Business logic lives entirely
 * in the reducer (pure), not here.
 */
export function state$(seed: AppState): Observable<AppState> {
  const dailyResets$: Observable<Intent> = dailyReset$().pipe(
    map((date): Intent => ({ type: 'DAILY_RESET', date })),
  );

  return merge(intent$, dailyResets$).pipe(scan((state, intent) => reduce(state, intent), seed));
}
