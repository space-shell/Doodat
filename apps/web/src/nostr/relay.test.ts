import { describe, it, expect } from 'vitest';
import { finalizeEvent, verifiedSymbol } from 'nostr-tools';
import type { EventTemplate, Event } from 'nostr-tools';
import { dayFilter, mergeDayTasks } from './relay';
import { buildDayTaskTemplate } from './events';
import { secretKeyToBytes } from './keys';

// Fixed test secret key (well-formed 32-byte hex) — used only to produce real
// signatures so mergeDayTasks' verification step passes in tests.
const TEST_SK = '0a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f6789';
const SK_BYTES = secretKeyToBytes(TEST_SK);

/** Sign a template with the test key → a real, verifiable event. */
function sign(t: EventTemplate) {
  return finalizeEvent({ ...t }, SK_BYTES);
}

/**
 * Strip the `verifiedSymbol` marker finalizeEvent stamps on, returning a plain
 * event. Relay-sourced events arrive as plain JSON (no symbol), so
 * verifyEvent must recompute — this mirrors reality when forging tests.
 */
function plain(e: Event): Event {
  const copy: Event = { ...e };
  delete (copy as Record<symbol, unknown>)[verifiedSymbol];
  return copy;
}

describe('dayFilter', () => {
  it('scopes by kind + author + since, with no unindexed #day tag', () => {
    const f = dayFilter('pk123', '2026-07-16');
    expect(f.kinds).toEqual([30018]);
    expect(f.authors).toEqual(['pk123']);
    expect('#day' in f).toBe(false); // relays reject unindexed tag filters
    expect(typeof f.since).toBe('number'); // since bounds to today's window
  });

  it('since is local midnight of the date', () => {
    const since = dayFilter('pk', '2026-07-16').since;
    expect(since).toBe(Math.floor(new Date('2026-07-16T00:00:00').getTime() / 1000));
  });
});

describe('mergeDayTasks', () => {
  it('decodes a single signed event', () => {
    const e = sign(
      buildDayTaskTemplate('2026-07-16', 'phys-003', { status: 'todo', order: 0, intensity: 'medium' }, 1000),
    );
    expect(mergeDayTasks([e])).toEqual([
      { date: '2026-07-16', taskId: 'phys-003', status: 'todo', order: 0, intensity: 'medium', createdAt: 1000 },
    ]);
  });

  it('keeps the latest created_at per task (replaceable semantics)', () => {
    const older = sign(
      buildDayTaskTemplate('2026-07-16', 'phys-003', { status: 'todo', order: 0, intensity: 'medium' }, 1000),
    );
    const newer = sign(
      buildDayTaskTemplate('2026-07-16', 'phys-003', { status: 'done', order: 0, intensity: 'medium' }, 2000),
    );
    expect(mergeDayTasks([older, newer])).toEqual([
      { date: '2026-07-16', taskId: 'phys-003', status: 'done', order: 0, intensity: 'medium', createdAt: 2000 },
    ]);
    // order of input does not matter
    expect(mergeDayTasks([newer, older])).toEqual([
      { date: '2026-07-16', taskId: 'phys-003', status: 'done', order: 0, intensity: 'medium', createdAt: 2000 },
    ]);
  });

  it('keeps distinct tasks and sorts ascending by order', () => {
    const a = sign(
      buildDayTaskTemplate('2026-07-16', 'spir-002', { status: 'todo', order: 5, intensity: 'low' }, 1000),
    );
    const b = sign(
      buildDayTaskTemplate('2026-07-16', 'phys-001', { status: 'done', order: 0, intensity: 'low' }, 1000),
    );
    const merged = mergeDayTasks([a, b]);
    expect(merged.map((t) => t.taskId)).toEqual(['phys-001', 'spir-002']);
    expect(merged.map((t) => t.order)).toEqual([0, 5]);
  });

  it('drops events of a different kind', () => {
    const good = sign(
      buildDayTaskTemplate('2026-07-16', 'phys-003', { status: 'todo', order: 0, intensity: 'medium' }, 1000),
    );
    const badKind = { ...good, kind: 1 } as unknown as ReturnType<typeof sign>;
    expect(mergeDayTasks([good, badKind])).toHaveLength(1);
  });

  it('drops events with an invalid signature', () => {
    const e = sign(
      buildDayTaskTemplate('2026-07-16', 'phys-003', { status: 'todo', order: 0, intensity: 'medium' }, 1000),
    );
    const forged = plain({ ...e, sig: 'a'.repeat(128) });
    expect(mergeDayTasks([forged])).toEqual([]);
  });

  it('drops events with malformed content', () => {
    const e = sign(
      buildDayTaskTemplate('2026-07-16', 'phys-003', { status: 'todo', order: 0, intensity: 'medium' }, 1000),
    );
    const badContent = plain({ ...e, content: 'garbage' });
    // changing content invalidates the signature, so it's dropped on verify;
    // this confirms malformed/unsigned content never reaches the output
    expect(mergeDayTasks([badContent])).toEqual([]);
  });

  it('returns an empty array for no events', () => {
    expect(mergeDayTasks([])).toEqual([]);
  });

  it('filters to an exact date when given (client-side, since relays cannot)', () => {
    const today = sign(
      buildDayTaskTemplate('2026-07-16', 'phys-003', { status: 'todo', order: 0, intensity: 'medium' }, 1000),
    );
    const yesterday = sign(
      buildDayTaskTemplate('2026-07-15', 'phys-004', { status: 'todo', order: 0, intensity: 'medium' }, 1000),
    );
    expect(mergeDayTasks([today, yesterday], '2026-07-16').map((t) => t.taskId)).toEqual(['phys-003']);
    expect(mergeDayTasks([today, yesterday], '2026-07-15').map((t) => t.taskId)).toEqual(['phys-004']);
    // no date → returns everything
    expect(mergeDayTasks([today, yesterday]).map((t) => t.taskId).sort()).toEqual(['phys-003', 'phys-004']);
  });
});
