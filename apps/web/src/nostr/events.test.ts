import { describe, it, expect } from 'vitest';
import type { Event, EventTemplate } from 'nostr-tools';
import {
  DAY_TASK_KIND,
  dayTaskDTag,
  encodeDayTaskContent,
  decodeDayTaskContent,
  buildDayTaskTemplate,
  decodeDayTask,
} from './events';

const DATE = '2026-07-16';
const TASK_ID = 'phys-003';

/** Turn a template into a structurally-complete Event (no real signature). */
function asEvent(t: EventTemplate, over: Partial<Event> = {}): Event {
  return {
    kind: t.kind,
    tags: t.tags,
    content: t.content,
    created_at: t.created_at,
    pubkey: 'pubkey',
    id: 'id',
    sig: 'sig',
    ...over,
  };
}

describe('dayTaskDTag', () => {
  it('joins date and taskId with a colon', () => {
    expect(dayTaskDTag(DATE, TASK_ID)).toBe('2026-07-16:phys-003');
  });
});

describe('content codec', () => {
  it('round-trips a todo payload', () => {
    expect(
      decodeDayTaskContent(encodeDayTaskContent({ status: 'todo', order: 0, intensity: 'medium' })),
    ).toEqual({ status: 'todo', order: 0, intensity: 'medium' });
  });

  it('round-trips a done payload', () => {
    expect(
      decodeDayTaskContent(encodeDayTaskContent({ status: 'done', order: 7, intensity: 'high' })),
    ).toEqual({ status: 'done', order: 7, intensity: 'high' });
  });

  it('rejects malformed JSON', () => {
    expect(decodeDayTaskContent('{not json')).toBeNull();
  });

  it('rejects missing fields', () => {
    expect(decodeDayTaskContent(JSON.stringify({ status: 'todo', order: 0 }))).toBeNull();
    expect(decodeDayTaskContent(JSON.stringify({ order: 0, intensity: 'low' }))).toBeNull();
  });

  it('rejects invalid status values', () => {
    expect(
      decodeDayTaskContent(JSON.stringify({ status: 'pending', order: 0, intensity: 'low' })),
    ).toBeNull();
    expect(
      decodeDayTaskContent(JSON.stringify({ status: 1, order: 0, intensity: 'low' })),
    ).toBeNull();
  });

  it('rejects non-finite or negative order', () => {
    expect(
      decodeDayTaskContent(JSON.stringify({ status: 'done', order: -1, intensity: 'low' })),
    ).toBeNull();
    expect(
      decodeDayTaskContent(JSON.stringify({ status: 'done', order: 'x', intensity: 'low' })),
    ).toBeNull();
  });

  it('rejects invalid intensity', () => {
    expect(
      decodeDayTaskContent(JSON.stringify({ status: 'done', order: 0, intensity: 'extreme' })),
    ).toBeNull();
    expect(
      decodeDayTaskContent(JSON.stringify({ status: 'done', order: 0, intensity: 2 })),
    ).toBeNull();
  });
});

describe('buildDayTaskTemplate', () => {
  it('uses the day-task kind, a d tag, and a day tag', () => {
    const t = buildDayTaskTemplate(
      DATE,
      TASK_ID,
      { status: 'todo', order: 2, intensity: 'medium' },
      1000,
    );
    expect(t.kind).toBe(DAY_TASK_KIND);
    expect(t.tags).toContainEqual(['d', '2026-07-16:phys-003']);
    expect(t.tags).toContainEqual(['day', '2026-07-16']);
    expect(t.created_at).toBe(1000);
    expect(decodeDayTaskContent(t.content)).toEqual({ status: 'todo', order: 2, intensity: 'medium' });
  });
});

describe('decodeDayTask', () => {
  it('round-trips through a built template, carrying createdAt', () => {
    const e = asEvent(
      buildDayTaskTemplate(DATE, TASK_ID, { status: 'done', order: 4, intensity: 'high' }, 9),
    );
    expect(decodeDayTask(e)).toEqual({
      date: DATE,
      taskId: TASK_ID,
      status: 'done',
      order: 4,
      intensity: 'high',
      createdAt: 9,
    });
  });

  it('returns null for a different kind', () => {
    const e = asEvent(buildDayTaskTemplate(DATE, TASK_ID, { status: 'todo', order: 0, intensity: 'low' }));
    expect(decodeDayTask({ ...e, kind: 1 })).toBeNull();
  });

  it('returns null when the d tag is missing', () => {
    const e = asEvent(buildDayTaskTemplate(DATE, TASK_ID, { status: 'todo', order: 0, intensity: 'low' }));
    e.tags = e.tags.filter((t) => t[0] !== 'd');
    expect(decodeDayTask(e)).toBeNull();
  });

  it('returns null when the day tag is missing', () => {
    const e = asEvent(buildDayTaskTemplate(DATE, TASK_ID, { status: 'todo', order: 0, intensity: 'low' }));
    e.tags = e.tags.filter((t) => t[0] !== 'day');
    expect(decodeDayTask(e)).toBeNull();
  });

  it('returns null when d-tag date disagrees with day tag (tamper)', () => {
    const e = asEvent(buildDayTaskTemplate(DATE, TASK_ID, { status: 'todo', order: 0, intensity: 'low' }));
    e.tags = e.tags.map((t) => (t[0] === 'day' ? ['day', '2026-07-15'] : t));
    expect(decodeDayTask(e)).toBeNull();
  });

  it('returns null for malformed content', () => {
    const e = asEvent(buildDayTaskTemplate(DATE, TASK_ID, { status: 'todo', order: 0, intensity: 'low' }));
    e.content = 'garbage';
    expect(decodeDayTask(e)).toBeNull();
  });

  it('returns null for a badly-shaped date', () => {
    const e = asEvent(buildDayTaskTemplate(DATE, TASK_ID, { status: 'todo', order: 0, intensity: 'low' }));
    // corrupt both d and day to an invalid date string
    e.tags = [
      ['d', 'not-a-date:phys-003'],
      ['day', 'not-a-date'],
    ];
    expect(decodeDayTask(e)).toBeNull();
  });
});
