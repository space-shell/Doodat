import { describe, it, expect } from 'vitest';
import { from, Observable } from 'rxjs';
import { emitOnChange } from './time';

const collect = <T>(obs: Observable<T>) =>
  new Promise<T[]>((resolve) => {
    const out: T[] = [];
    obs.subscribe({
      next: (v) => out.push(v),
      complete: () => resolve(out),
    });
  });

describe('emitOnChange operator', () => {
  it('drops the initial value and consecutive duplicates, emits only on change', async () => {
    const emits = await collect(from(['a', 'a', 'b', 'b', 'c', 'c']).pipe(emitOnChange()));
    expect(emits).toEqual(['b', 'c']);
  });

  it('emits nothing when the value never changes', async () => {
    const emits = await collect(from(['x', 'x', 'x']).pipe(emitOnChange()));
    expect(emits).toEqual([]);
  });

  it('emits nothing for a single reading', async () => {
    const emits = await collect(from(['only']).pipe(emitOnChange()));
    expect(emits).toEqual([]);
  });
});
