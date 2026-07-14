import { Observable, interval, OperatorFunction } from 'rxjs';
import { distinctUntilChanged, map, skip } from 'rxjs/operators';
import { todayString } from '@doodat/cards';

/**
 * Pass-through operator: dedupes consecutive equal values, then drops the
 * first (the baseline). Subscribers therefore see a value only when the
 * underlying reading actually changes. Used by the reset streams.
 */
export function emitOnChange<T>(): OperatorFunction<T, T> {
  return (source) => source.pipe(distinctUntilChanged(), skip(1));
}

/**
 * Emits the new date string whenever the local calendar day rolls over.
 * Polls every `pollMs` (default 60s — precise to the minute is plenty for a
 * daily ritual app). The store seeds the initial date; this stream only fires
 * on an actual change, which the state machine turns into a DAILY_RESET intent.
 */
export function dailyReset$(pollMs = 60_000): Observable<string> {
  return interval(pollMs).pipe(map(() => todayString()), emitOnChange());
}
