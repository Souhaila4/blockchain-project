/** Pure helpers that turn a list of point movements into the numbers and chart on the dashboards. */

export type Range = "7D" | "30D" | "1Y";

export const RANGES: readonly Range[] = ["7D", "30D", "1Y"];

export type Dated = { timestamp: number; points: bigint };

export type SeriesPoint = { label: string; value: number };

const DAY_SECONDS = 86_400;

/** How many seconds back each range reaches. */
const SPAN_SECONDS: Record<Range, number> = {
  "7D": 7 * DAY_SECONDS,
  "30D": 30 * DAY_SECONDS,
  "1Y": 365 * DAY_SECONDS,
};

export function sumPoints(items: readonly Dated[]) {
  return items.reduce((total, item) => total + item.points, BigInt(0));
}

/** Points moved during the last `range`. */
export function pointsInRange(items: readonly Dated[], range: Range, now: number) {
  return sumPoints(items.filter((item) => item.timestamp > now - SPAN_SECONDS[range]));
}

/** Percent change of the last `range` against the range before it. Null when there is nothing to compare. */
export function percentChange(items: readonly Dated[], range: Range, now: number) {
  const span = SPAN_SECONDS[range];
  const current = pointsInRange(items, range, now);
  const previous = sumPoints(
    items.filter((item) => item.timestamp > now - 2 * span && item.timestamp <= now - span),
  );

  if (previous === BigInt(0)) return null;
  return Math.round((Number(current - previous) / Number(previous)) * 100);
}

/** One point per day for 7D and 30D, one per month for 1Y. The last point is the current day or month. */
export function buildSeries(items: readonly Dated[], range: Range, now: number): SeriesPoint[] {
  const monthly = range === "1Y";
  const count = range === "7D" ? 7 : range === "30D" ? 30 : 12;
  const today = new Date(now * 1000);

  // Bucket start times, oldest first. Built with Date so months and daylight saving come out right.
  const starts = Array.from({ length: count }, (_, index) => {
    const back = count - 1 - index;
    return monthly
      ? new Date(today.getFullYear(), today.getMonth() - back, 1)
      : new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
  });

  const totals = starts.map(() => BigInt(0));
  const boundaries = starts.map((start) => start.getTime() / 1000);

  for (const item of items) {
    const index = lastIndexAtOrBefore(boundaries, item.timestamp);
    if (index >= 0) totals[index] += item.points;
  }

  return starts.map((start, index) => ({
    label: start.toLocaleDateString(
      "en-US",
      monthly ? { month: "short", year: "numeric" } : { month: "short", day: "numeric" },
    ),
    value: Number(totals[index]),
  }));
}

/** Index of the last boundary that is not after `value`, or -1 when `value` is earlier than all of them. */
function lastIndexAtOrBefore(boundaries: readonly number[], value: number) {
  let found = -1;
  for (let index = 0; index < boundaries.length && boundaries[index] <= value; index += 1) {
    found = index;
  }
  return found;
}
