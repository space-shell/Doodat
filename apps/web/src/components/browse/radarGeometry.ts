// Pure geometry for the hand-rolled SVG radar chart.
// All functions are framework-agnostic and unit-tested in node.
// Coordinate convention: +x right, +y down (SVG). Axis `i` of `n` points at
// angle -90° + i·(360°/n), so the first axis points straight up.

export interface Point {
  x: number;
  y: number;
}

/** Radians angle of axis `i` (0-indexed) among `n` evenly-spaced axes. */
export function axisAngle(i: number, n: number): number {
  return -Math.PI / 2 + (i * 2 * Math.PI) / n;
}

/** Convert a polar coordinate (angle in radians, radius) to a cartesian point. */
export function polarPoint(angle: number, radius: number, center: Point): Point {
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
}

/** Clamp a value into [0, max] and scale to a fraction of the radius. */
function scaledRadius(value: number, max: number, radius: number): number {
  if (max <= 0) return 0;
  const frac = Math.max(0, Math.min(1, value / max));
  return frac * radius;
}

/**
 * Compute the data-polygon vertices for a radar chart.
 * One vertex per axis, positioned at `value/max * radius` along that axis.
 * Values are clamped to [0, max].
 */
export function radarVertices(
  axes: string[],
  values: number[],
  max: number,
  radius: number,
  center: Point,
): Point[] {
  if (axes.length !== values.length) {
    throw new Error(
      `radarVertices: axes (${axes.length}) and values (${values.length}) must match`,
    );
  }
  return values.map((v, i) => polarPoint(axisAngle(i, axes.length), scaledRadius(v, max, radius), center));
}

/** Build an SVG path string for a closed polygon through the given points. */
export function polygonPath(points: Point[]): string {
  if (points.length < 3) return '';
  const [first, ...rest] = points;
  const segments = rest.map((p) => `L${p.x},${p.y}`).join(' ');
  return `M${first.x},${first.y} ${segments} Z`;
}

/** Cartesian position for the label of axis `i`, at `labelRadius` from centre. */
export function axisLabelPos(i: number, n: number, labelRadius: number, center: Point): Point {
  return polarPoint(axisAngle(i, n), labelRadius, center);
}
