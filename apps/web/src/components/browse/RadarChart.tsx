import type { Component } from 'solid-js';
import { For } from 'solid-js';
import {
  radarVertices,
  polygonPath,
  axisLabelPos,
  axisAngle,
  polarPoint,
} from './radarGeometry';

export interface RadarChartProps {
  /** Axis labels (rendered outside the chart). */
  axes: string[];
  /** One value per axis. Clamped to [0, max]. */
  values: number[];
  /** Value at the outer ring. Defaults to max(values). */
  max?: number;
  /** Polygon + axis colour (hex). Defaults to gold. */
  color?: string;
  /** Square chart size in px. */
  size?: number;
}

const RadarChart: Component<RadarChartProps> = (props) => {
  const size = () => props.size ?? 320;
  const center = () => ({ x: size() / 2, y: size() / 2 });
  // Outer ring radius — leaves room for labels.
  const radius = () => size() * 0.36;
  const labelRadius = () => size() * 0.46;

  const max = () => {
    if (props.max !== undefined) return props.max;
    const m = Math.max(1, ...props.values);
    // Round up to a tidy number so rings read nicely.
    const pow = Math.pow(10, Math.floor(Math.log10(m)));
    return Math.max(1, Math.ceil(m / pow) * pow);
  };

  const ringFractions = [0.25, 0.5, 0.75, 1];

  const dataPath = () =>
    polygonPath(radarVertices(props.axes, props.values, max(), radius(), center()));

  const stroke = () => props.color ?? '#C4A882';
  const fill = () => `${stroke()}33`; // ~20% opacity

  return (
    <svg
      data-testid="radar-chart"
      viewBox={`0 0 ${size()} ${size()}`}
      class="w-full max-w-sm mx-auto"
      role="img"
      aria-label="Card distribution radar chart"
    >
      {/* Concentric polygon grid rings */}
      <For each={ringFractions}>
        {(frac) => {
          const ring = polygonPath(
            props.axes.map((_, i) =>
              polarPoint(axisAngle(i, props.axes.length), frac * radius(), center()),
            ),
          );
          return <path d={ring} fill="none" stroke="#C8C0B2" stroke-width="1" opacity="0.55" />;
        }}
      </For>

      {/* Radiating axes */}
      <For each={props.axes}>
        {(_, i) => {
          const tip = polarPoint(axisAngle(i(), props.axes.length), radius(), center());
          return (
            <line
              x1={center().x}
              y1={center().y}
              x2={tip.x}
              y2={tip.y}
              stroke="#C8C0B2"
              stroke-width="1"
              opacity="0.55"
            />
          );
        }}
      </For>

      {/* Data polygon */}
      <path d={dataPath()} fill={fill()} stroke={stroke()} stroke-width="2" stroke-linejoin="round" />

      {/* Data vertices */}
      <For each={radarVertices(props.axes, props.values, max(), radius(), center())}>
        {(p) => <circle cx={p.x} cy={p.y} r="3" fill={stroke()} />}
      </For>

      {/* Axis labels with counts */}
      <For each={props.axes}>
        {(label, i) => {
          const pos = axisLabelPos(i(), props.axes.length, labelRadius(), center());
          const count = props.values[i()];
          return (
            <text
              x={pos.x}
              y={pos.y}
              text-anchor="middle"
              dominant-baseline="middle"
              class="fill-dodaat-textSecondary"
              style={{ 'font-size': '11px', 'font-weight': 600 }}
            >
              {label}
              <tspan class="fill-dodaat-textMuted" style={{ 'font-weight': 400 }} dx="3">
                {count}
              </tspan>
            </text>
          );
        }}
      </For>
    </svg>
  );
};

export default RadarChart;
