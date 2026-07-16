import { finalizeEvent, verifyEvent } from 'nostr-tools';
import type { Event, SimplePool } from 'nostr-tools';
import { DAY_TASK_KIND, type DayTask, type DayTaskPayload, decodeDayTask, buildDayTaskTemplate } from './events';
import { secretKeyToBytes } from './keys';

/**
 * Default relay set for the MVP. Multi-device sync requires both devices to
 * publish/fetch overlapping relays; this mainstream free set works for the
 * common case. Move into Settings once key management lands.
 */
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
];

/** The filter that fetches every day-task event for a pubkey on a date. */
export function dayFilter(pubkey: string, date: string) {
  return { kinds: [DAY_TASK_KIND], authors: [pubkey], '#day': [date] };
}

/**
 * Merge raw fetched events into a deduplicated DayTask list.
 *
 * Per NIP-33 replaceable semantics, when several events share a `d` tag
 * (same date+taskId) the highest-`created_at` wins. Signatures are verified,
 * then each surviving event is decoded; invalid events are dropped. Output is
 * sorted ascending by `order` so every device renders the tasks identically.
 */
export function mergeDayTasks(events: Event[]): DayTask[] {
  const latest = new Map<string, Event>();
  for (const e of events) {
    if (e.kind !== DAY_TASK_KIND) continue;
    if (!verifyEvent(e)) continue;
    const dTag = e.tags.find((t) => t[0] === 'd');
    if (!dTag?.[1]) continue;
    const cur = latest.get(dTag[1]);
    if (!cur || e.created_at > cur.created_at) latest.set(dTag[1], e);
  }

  const tasks: DayTask[] = [];
  for (const e of latest.values()) {
    const t = decodeDayTask(e);
    if (t) tasks.push(t);
  }
  tasks.sort((a, b) => a.order - b.order);
  return tasks;
}

/** Fetch and merge all day-tasks for a pubkey on a date. Rejects on timeout. */
export async function fetchDayTasks(
  pool: SimplePool,
  relays: string[],
  pubkey: string,
  date: string,
  timeoutMs = 10_000,
): Promise<DayTask[]> {
  const events = await pool.querySync(relays, dayFilter(pubkey, date), { maxWait: timeoutMs });
  return mergeDayTasks(events);
}

/** Publish (or update) a single day-task. Returns the relays that accepted it. */
export async function publishDayTask(
  pool: SimplePool,
  relays: string[],
  skHex: string,
  date: string,
  taskId: string,
  payload: DayTaskPayload,
): Promise<string[]> {
  const signed = finalizeEvent(buildDayTaskTemplate(date, taskId, payload), secretKeyToBytes(skHex));
  const results = await pool.publish(relays, signed, { maxWait: 5_000 });
  const settled = await Promise.allSettled(results);
  return settled
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map((r) => r.value);
}
