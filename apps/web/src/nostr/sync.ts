import { cardById } from '@doodat/cards';
import type { CardOutcome } from '@doodat/cards';
import type { DeckCard } from '../types';
import type { DayTask } from './events';

/**
 * Pure transforms between Nostr day-tasks and the app's deck.
 *
 * When day-task events exist on Nostr (another device originated the day, or a
 * future bot did), the deck is *rebuilt* from those events: each task's id
 * resolves to a ContentCard via the shared `cardById` map, tasks render in
 * their published `order`, and a completion card is appended. When no events
 * exist, the originating device deals locally (the existing path) and then
 * publishes the dealt set via `dealToPublishList`.
 *
 * Each task event carries the originating day's `intensity`, so synced devices
 * can rebuild accurate CardOutcomes; the event `created_at` (seconds) serves as
 * the completion timestamp for done tasks.
 */

/**
 * Build a deck from fetched day-tasks. Tasks are sorted ascending by `order`
 * (so callers need not pre-sort); unknown ids are skipped; a trailing
 * completion card is always appended.
 */
export function deckFromDayTasks(tasks: DayTask[], date: string): DeckCard[] {
  const sorted = [...tasks].sort((a, b) => a.order - b.order);
  const deck: DeckCard[] = [];
  for (const t of sorted) {
    const card = cardById.get(t.taskId);
    if (card) deck.push(card);
  }
  deck.push({ id: `sys-completion-${date}`, type: 'completion' });
  return deck;
}

/** The set of task ids whose latest status is 'done'. */
export function completedTaskIds(tasks: DayTask[]): Set<string> {
  const ids = new Set<string>();
  for (const t of tasks) {
    if (t.status === 'done') ids.add(t.taskId);
  }
  return ids;
}

/** The {taskId, order} list to publish from a freshly dealt deck (content cards only). */
export function dealToPublishList(deck: DeckCard[]): { taskId: string; order: number }[] {
  const out: { taskId: string; order: number }[] = [];
  let order = 0;
  for (const c of deck) {
    if (c.type !== 'content') continue;
    out.push({ taskId: c.id, order });
    order++;
  }
  return out;
}

/**
 * Rebuild CardOutcomes from synced done-tasks: intensity comes from the event,
 * difficulty from the card, timestamp from the event created_at (s → ms).
 * Unknown ids are skipped.
 */
export function outcomesFromDayTasks(tasks: DayTask[]): CardOutcome[] {
  const outcomes: CardOutcome[] = [];
  for (const t of tasks) {
    if (t.status !== 'done') continue;
    const card = cardById.get(t.taskId);
    if (!card) continue;
    outcomes.push({
      cardId: card.id,
      domain: card.domain,
      swipeDirection: 'complete',
      intensity: t.intensity,
      difficulty: card.difficulty,
      timestamp: t.createdAt * 1000,
    });
  }
  return outcomes;
}
