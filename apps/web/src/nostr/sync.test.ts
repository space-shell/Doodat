import { describe, it, expect } from 'vitest';
import { deckFromDayTasks, completedTaskIds, dealToPublishList } from './sync';
import type { DayTask } from './events';
import type { DeckCard } from '../types';

const DATE = '2026-07-16';

function task(taskId: string, order: number, status: 'todo' | 'done' = 'todo'): DayTask {
  return { date: DATE, taskId, status, order };
}

describe('deckFromDayTasks', () => {
  it('resolves known task ids to content cards and appends a completion card', () => {
    const deck = deckFromDayTasks([task('phys-001', 0), task('ment-001', 1)], DATE);
    expect(deck.map((c) => (c.type === 'content' ? c.id : c.type))).toEqual([
      'phys-001',
      'ment-001',
      'completion',
    ]);
  });

  it('orders by task order regardless of input order', () => {
    const deck = deckFromDayTasks([task('ment-001', 1), task('phys-001', 0)], DATE);
    expect(deck[0].type === 'content' && deck[0].id).toBe('phys-001');
    expect(deck[1].type === 'content' && deck[1].id).toBe('ment-001');
  });

  it('skips unknown task ids (stale references to deleted cards)', () => {
    const deck = deckFromDayTasks([task('phys-001', 0), task('phys-999', 1)], DATE);
    expect(deck.filter((c) => c.type === 'content')).toHaveLength(1);
    expect(deck[deck.length - 1].type).toBe('completion');
  });

  it('returns only the completion card for an empty task list', () => {
    const deck = deckFromDayTasks([], DATE);
    expect(deck).toHaveLength(1);
    expect(deck[0].type).toBe('completion');
  });
});

describe('completedTaskIds', () => {
  it('collects ids of done tasks, ignoring todo', () => {
    const ids = completedTaskIds([
      task('phys-001', 0, 'done'),
      task('ment-001', 1, 'todo'),
      task('spir-001', 2, 'done'),
    ]);
    expect(ids).toEqual(new Set(['phys-001', 'spir-001']));
  });

  it('returns an empty set when nothing is done', () => {
    expect(completedTaskIds([task('phys-001', 0, 'todo')])).toEqual(new Set());
  });
});

describe('dealToPublishList', () => {
  it('extracts content card ids in deck order with sequential order indices', () => {
    const content = (id: string): DeckCard =>
      ({ id, type: 'content' } as unknown as DeckCard);
    const deck: DeckCard[] = [
      { id: 'sys-intensity', type: 'intensity_select' },
      content('phys-001'),
      content('ment-001'),
      { id: 'sys-completion', type: 'completion' },
    ];
    expect(dealToPublishList(deck)).toEqual([
      { taskId: 'phys-001', order: 0 },
      { taskId: 'ment-001', order: 1 },
    ]);
  });

  it('returns an empty list for a deck with no content cards', () => {
    expect(dealToPublishList([{ id: 'sys-x', type: 'welcome' }])).toEqual([]);
  });
});
