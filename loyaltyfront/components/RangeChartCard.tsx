"use client";

import { useMemo, useState, type ReactNode } from "react";
import { formatPoints, plusPoints } from "@/lib/format";
import {
  RANGES,
  buildSeries,
  percentChange,
  pointsInRange,
  type Dated,
  type Range,
} from "@/lib/stats";
import { AreaChart } from "./AreaChart";
import { ArrowDownIcon, ArrowUpIcon } from "./icons";
import { Card } from "./ui";

const RANGE_TEXT: Record<Range, string> = {
  "7D": "last 7 days",
  "30D": "last 30 days",
  "1Y": "last 12 months",
};

type RangeChartCardProps = {
  title: string;
  /** What the number counts, for example "to customers". The selected range is added after it. */
  caption: string;
  icon: ReactNode;
  /** The movements to total and plot. */
  items: readonly Dated[];
};

/** Big total for the chosen range, how it compares with the range before, and a chart of it. */
export function RangeChartCard({ title, caption, icon, items }: RangeChartCardProps) {
  const [range, setRange] = useState<Range>("7D");
  // Fixed when the card mounts, so the chart does not shift while it is on screen.
  const [now] = useState(() => Math.floor(Date.now() / 1000));

  const total = useMemo(() => pointsInRange(items, range, now), [items, range, now]);
  const change = useMemo(() => percentChange(items, range, now), [items, range, now]);
  const series = useMemo(() => buildSeries(items, range, now), [items, range, now]);

  return (
    <Card>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F07340]/15 text-[#F07340]">
              {icon}
            </span>
            <h2 className="text-sm font-medium text-white">{title}</h2>
          </div>

          <p className="mt-5 text-5xl font-medium tracking-tight text-white">{formatPoints(total)}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-xs text-white/55">
              {caption} · {RANGE_TEXT[range]}
            </p>
            {change !== null ? <ChangeBadge change={change} /> : null}
          </div>
        </div>

        <div>
          <div role="group" aria-label="Time range" className="mb-2 flex justify-end gap-2">
            {RANGES.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={range === option}
                onClick={() => setRange(option)}
                className={`cursor-pointer rounded-full border px-3.5 py-1 text-xs ${
                  range === option
                    ? "border-[#F07340] bg-[#F07340]/10 text-[#F07340]"
                    : "border-white/10 text-white/60 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <AreaChart
            data={series}
            describeValue={plusPoints}
            label={`${title}, ${RANGE_TEXT[range]}: ${formatPoints(total)}`}
          />
        </div>
      </div>
    </Card>
  );
}

function ChangeBadge({ change }: { change: number }) {
  const up = change >= 0;
  const Arrow = up ? ArrowUpIcon : ArrowDownIcon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
        up ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
      }`}
    >
      <Arrow className="h-3 w-3" />
      {Math.abs(change)}%
    </span>
  );
}
