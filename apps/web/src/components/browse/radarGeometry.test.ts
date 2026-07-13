import { describe, it, expect } from 'vitest';
import { radarVertices, polygonPath, axisLabelPos, polarPoint, axisAngle } from './radarGeometry';

// Rounding helper — float trig is noisy; compare to 4dp.
const r = (n: number) => Math.round(n * 10000) / 10000;
const round = ({ x, y }: { x: number; y: number }) => ({ x: r(x), y: r(y) });

// ─── axisAngle ────────────────────────────────────────────────────────────────

describe('axisAngle', () => {
  it('places the first axis pointing up (-90°)', () => {
    expect(r(axisAngle(0, 3))).toBe(r(-Math.PI / 2));
  });

  it('spreads n axes evenly at 360°/n apart', () => {
    const a0 = axisAngle(0, 4);
    const a1 = axisAngle(1, 4);
    expect(r(a1 - a0)).toBe(r(Math.PI / 2)); // 90° apart for n=4
  });
});

// ─── polarPoint ───────────────────────────────────────────────────────────────

describe('polarPoint', () => {
  it('angle -90° points straight up (-y)', () => {
    expect(round(polarPoint(-Math.PI / 2, 100, { x: 0, y: 0 }))).toEqual({ x: 0, y: -100 });
  });

  it('angle 0° points right (+x)', () => {
    expect(round(polarPoint(0, 50, { x: 10, y: 10 }))).toEqual({ x: 60, y: 10 });
  });

  it('respects the centre offset', () => {
    expect(round(polarPoint(-Math.PI / 2, 50, { x: 100, y: 100 }))).toEqual({ x: 100, y: 50 });
  });
});

// ─── radarVertices ────────────────────────────────────────────────────────────

describe('radarVertices', () => {
  it('places 3 axes at 120° apart, first pointing up', () => {
    const v = radarVertices(['a', 'b', 'c'], [1, 1, 1], 1, 100, { x: 0, y: 0 }).map(round);
    // up, down-right, down-left
    expect(v).toEqual([
      { x: 0, y: -100 },
      { x: r(100 * Math.cos(axisAngle(1, 3))), y: r(100 * Math.sin(axisAngle(1, 3))) },
      { x: r(100 * Math.cos(axisAngle(2, 3))), y: r(100 * Math.sin(axisAngle(2, 3))) },
    ]);
  });

  it('scales a value of 0.5 to half the radius', () => {
    const v = radarVertices(['a'], [0.5], 1, 100, { x: 0, y: 0 }).map(round);
    expect(v).toEqual([{ x: 0, y: -50 }]);
  });

  it('clamps values above max to the outer ring', () => {
    const v = radarVertices(['a'], [1.7], 1, 100, { x: 0, y: 0 }).map(round);
    expect(v).toEqual([{ x: 0, y: -100 }]);
  });

  it('clamps negative values to the centre', () => {
    const v = radarVertices(['a'], [-3], 1, 100, { x: 0, y: 0 }).map(round);
    expect(v).toEqual([{ x: 0, y: 0 }]);
  });

  it('returns one vertex per axis', () => {
    const v = radarVertices(['a', 'b', 'c', 'd', 'e'], [0.2, 0.4, 0.6, 0.8, 1], 1, 80, { x: 5, y: 5 });
    expect(v).toHaveLength(5);
  });

  it('throws if axes and values have different lengths', () => {
    expect(() => radarVertices(['a', 'b'], [1], 1, 100, { x: 0, y: 0 })).toThrow();
  });
});

// ─── polygonPath ──────────────────────────────────────────────────────────────

describe('polygonPath', () => {
  it('builds a closed "M..L..L..Z" path string', () => {
    const path = polygonPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);
    expect(path).toBe('M0,0 L10,0 L10,10 L0,10 Z');
  });

  it('returns an empty string for fewer than 3 points', () => {
    expect(polygonPath([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe('');
    expect(polygonPath([])).toBe('');
  });
});

// ─── axisLabelPos ─────────────────────────────────────────────────────────────

describe('axisLabelPos', () => {
  it('places the first label above the chart centre', () => {
    expect(round(axisLabelPos(0, 3, 120, { x: 0, y: 0 }))).toEqual({ x: 0, y: -120 });
  });

  it('respects the provided centre offset', () => {
    expect(round(axisLabelPos(0, 4, 50, { x: 100, y: 100 }))).toEqual({ x: 100, y: 50 });
  });

  it('places the second-of-four label to the right', () => {
    expect(round(axisLabelPos(1, 4, 100, { x: 0, y: 0 }))).toEqual({ x: 100, y: 0 });
  });
});
