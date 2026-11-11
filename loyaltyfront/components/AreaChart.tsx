"use client";

import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { SeriesPoint } from "@/lib/stats";

const WIDTH = 640;
const HEIGHT = 180;
const PAD_X = 12;
const PAD_TOP = 28;
const PAD_BOTTOM = 12;
/** Above this many points, dots are drawn only for the one being inspected. */
const MAX_DOTS = 12;

type Coordinate = readonly [number, number];

/**
 * Smooth line through `points` that never overshoots between them (monotone cubic interpolation),
 * so a flat stretch of zeros stays flat instead of dipping below the axis.
 */
function smoothPath(points: readonly Coordinate[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

  const spans = points.slice(1).map(([x, y], index) => ({
    dx: x - points[index][0],
    slope: (y - points[index][1]) / (x - points[index][0]),
  }));

  const tangents = points.map((_, index) => {
    if (index === 0) return spans[0].slope;
    if (index === points.length - 1) return spans[index - 1].slope;

    const before = spans[index - 1];
    const after = spans[index];
    if (before.slope * after.slope <= 0) return 0;

    return (
      (3 * (before.dx + after.dx)) /
      ((2 * after.dx + before.dx) / before.slope + (after.dx + 2 * before.dx) / after.slope)
    );
  });

  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let index = 1; index < points.length; index += 1) {
    const [x0, y0] = points[index - 1];
    const [x1, y1] = points[index];
    const third = (x1 - x0) / 3;
    path += ` C ${x0 + third} ${y0 + tangents[index - 1] * third} ${x1 - third} ${
      y1 - tangents[index] * third
    } ${x1} ${y1}`;
  }
  return path;
}

type AreaChartProps = {
  data: SeriesPoint[];
  /** Text for the tooltip, for example "+50 points". */
  describeValue: (value: number) => string;
  /** Read by screen readers as the chart's name. */
  label: string;
};

export function AreaChart({ data, describeValue, label }: AreaChartProps) {
  const gradientId = `area-${useId().replace(/:/g, "")}`;
  const [hovered, setHovered] = useState<number | null>(null);

  const step = data.length > 1 ? (WIDTH - 2 * PAD_X) / (data.length - 1) : 0;
  const peak = Math.max(1, ...data.map((point) => point.value));
  const coordinates: Coordinate[] = data.map((point, index) => [
    PAD_X + index * step,
    PAD_TOP + (1 - point.value / peak) * (HEIGHT - PAD_TOP - PAD_BOTTOM),
  ]);

  const line = smoothPath(coordinates);
  const baseline = HEIGHT - PAD_BOTTOM;
  const area = coordinates.length > 0
    ? `${line} L ${coordinates[coordinates.length - 1][0]} ${baseline} L ${coordinates[0][0]} ${baseline} Z`
    : "";

  // With nothing hovered, point at the highest value so the chart always shows one example.
  const highestValue = Math.max(0, ...data.map((point) => point.value));
  const highest = highestValue > 0 ? data.findIndex((point) => point.value === highestValue) : -1;
  const inspected = hovered ?? (highest >= 0 ? highest : null);
  const inspectedPoint = inspected === null ? null : data[inspected];
  const inspectedAt = inspected === null ? null : coordinates[inspected];

  function indexAt(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * WIDTH;
    return step === 0 ? 0 : Math.min(data.length - 1, Math.max(0, Math.round((x - PAD_X) / step)));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();

    const from = inspected ?? 0;
    const next = from + (event.key === "ArrowRight" ? 1 : -1);
    setHovered(Math.min(data.length - 1, Math.max(0, next)));
  }

  return (
    // Capped in width so the chart keeps a sensible height on very wide screens.
    <div className="ml-auto max-w-[44rem]">
      <div
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerMove={(event) => setHovered(indexAt(event))}
        onPointerLeave={() => setHovered(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setHovered(null)}
        className="cursor-crosshair rounded-lg pt-14 outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#F07340]"
      >
        {/* The wrapper's top padding is headroom for the tooltip, so it never covers what is above. */}
        <div className="relative">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full" aria-hidden="true">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F07340" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#F07340" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line}
              fill="none"
              stroke="#F07340"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {inspectedAt ? (
              <line
                x1={inspectedAt[0]}
                x2={inspectedAt[0]}
                y1={PAD_TOP - 8}
                y2={baseline}
                stroke="rgba(255,255,255,0.18)"
              />
            ) : null}

            {coordinates.map(([x, y], index) =>
              data.length <= MAX_DOTS || index === inspected ? (
                <circle
                  key={data[index].label}
                  cx={x}
                  cy={y}
                  r={index === inspected ? 4.5 : 3}
                  fill={index === inspected ? "#F07340" : "#100c0b"}
                  stroke="#F07340"
                  strokeWidth="1.8"
                />
              ) : null,
            )}
          </svg>

          {inspectedPoint && inspectedAt ? (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-[#1a1411] px-3 py-1.5 text-xs shadow-lg"
              style={{
                left: `${Math.min(88, Math.max(12, (inspectedAt[0] / WIDTH) * 100))}%`,
                top: `${(inspectedAt[1] / HEIGHT) * 100}%`,
                marginTop: -10,
              }}
            >
              <p className="whitespace-nowrap text-white/70">{inspectedPoint.label}</p>
              <p className="mt-0.5 whitespace-nowrap font-medium text-[#F07340]">
                {describeValue(inspectedPoint.value)}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-1 flex justify-between px-1 text-[11px] text-white/40">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}