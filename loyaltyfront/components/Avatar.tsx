import type { ReactNode } from "react";

const SIZES = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

/** A stable hue from any text, so the same wallet always gets the same color. */
function hueOf(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

/** A round colored badge. Shows `children`, or the first letter of `label`. */
export function Avatar({
  seed,
  label,
  size = "md",
  children,
}: {
  /** Picks the color. Use the wallet address. */
  seed: string;
  label?: string;
  size?: keyof typeof SIZES;
  children?: ReactNode;
}) {
  const hue = hueOf(seed);

  return (
    <span
      aria-hidden="true"
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 55% 28%))`,
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white ${SIZES[size]}`}
    >
      {children ?? label?.trim().charAt(0).toUpperCase()}
    </span>
  );
}
