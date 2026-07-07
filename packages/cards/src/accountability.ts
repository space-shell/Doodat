import type { CardOutcome } from './types';

/**
 * Count the number of skips in today's outcomes.
 */
export function countSkips(outcomes: CardOutcome[]): number {
  return outcomes.filter((o) => o.swipeDirection === 'skip').length;
}

/**
 * Whether the accountability prompt (US-005) should be injected.
 *
 * Per the user story: triggered on exactly the 3rd skip in a session,
 * suppressed once already shown (the prompt is a once-per-day intervention).
 * Skips are counted across the whole session, not consecutively — three
 * skips spread across nine cards still signals disengagement worth a prompt.
 */
export function shouldTriggerAccountability(
  outcomes: CardOutcome[],
  alreadyPrompted: boolean,
): boolean {
  return countSkips(outcomes) === 3 && !alreadyPrompted;
}
