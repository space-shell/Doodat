import type { Event, EventTemplate } from 'nostr-tools';

/**
 * Pure codec for a single day-task Nostr event.
 *
 * Shape (NIP-33 parameterized replaceable):
 *   kind  = DAY_TASK_KIND
 *   d     = "{date}:{taskId}"      — unique per pubkey+day+task (replaceability)
 *   #day  = "{date}"               — the discovery index devices filter on
 *   content = JSON { status, order }
 *
 * `status ∈ "todo" | "done"`; `order` = deck position (taskIds alone do not
 * define cross-device order). `domain` is omitted — derivable from the cardId
 * prefix. Decoding is structural only; signature verification is the relay
 * layer's concern.
 */
export const DAY_TASK_KIND = 30018;
const TAG_DAY = 'day';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type TaskStatus = 'todo' | 'done';

export interface DayTaskPayload {
  status: TaskStatus;
  order: number;
}

/** A decoded day-task: addressing (date, taskId) plus payload. */
export interface DayTask extends DayTaskPayload {
  date: string; // YYYY-MM-DD
  taskId: string;
}

/** Build the `d` tag. */
export function dayTaskDTag(date: string, taskId: string): string {
  return `${date}:${taskId}`;
}

/** Serialize a payload to the event content JSON. */
export function encodeDayTaskContent(payload: DayTaskPayload): string {
  return JSON.stringify(payload);
}

/** Parse day-task content; null if malformed or fields invalid. */
export function decodeDayTaskContent(raw: string): DayTaskPayload | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (typeof v !== 'object' || v === null) return null;
    const o = v as Record<string, unknown>;
    if (o.status !== 'todo' && o.status !== 'done') return null;
    if (typeof o.order !== 'number' || !Number.isFinite(o.order) || o.order < 0) return null;
    return { status: o.status, order: Math.floor(o.order) };
  } catch {
    return null;
  }
}

/** Build an unsigned event template ready for `finalizeEvent`. */
export function buildDayTaskTemplate(
  date: string,
  taskId: string,
  payload: DayTaskPayload,
  created_at: number = Math.floor(Date.now() / 1000),
): EventTemplate {
  return {
    kind: DAY_TASK_KIND,
    tags: [
      ['d', dayTaskDTag(date, taskId)],
      [TAG_DAY, date],
    ],
    content: encodeDayTaskContent(payload),
    created_at,
  };
}

/** Decode a signed event into a DayTask, or null if it isn't a valid day-task. */
export function decodeDayTask(event: Event): DayTask | null {
  if (event.kind !== DAY_TASK_KIND) return null;

  const dTag = event.tags.find((t) => t[0] === 'd');
  const dayTag = event.tags.find((t) => t[0] === TAG_DAY);
  if (!dTag || !dayTag) return null;

  const date = dayTag[1];
  if (!date || !DATE_RE.test(date)) return null;

  const colon = dTag[1].indexOf(':');
  if (colon < 0) return null;
  const dDate = dTag[1].slice(0, colon);
  const taskId = dTag[1].slice(colon + 1);
  if (!dDate || !taskId) return null;
  if (dDate !== date) return null; // tamper guard

  const payload = decodeDayTaskContent(event.content);
  if (!payload) return null;

  return { date, taskId, ...payload };
}
