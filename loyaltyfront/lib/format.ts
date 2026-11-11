import { formatEther } from "ethers";
import { CURRENCY } from "./config";

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Points are whole numbers (the token has 0 decimals). Groups thousands: 1,250. */
export function formatPoints(points: bigint | number) {
  return points.toLocaleString("en-US");
}

/** "+50 points", "+1 point". */
export function plusPoints(points: number) {
  return `+${formatPoints(points)} ${points === 1 ? "point" : "points"}`;
}

/** An amount in wei as "0.015 ETH". */
export function formatMoney(wei: bigint) {
  return `${formatEther(wei).replace(/\.0$/, "")} ${CURRENCY}`;
}

/** "Apr 27, 2026, 14:32" from a block time in seconds. */
export function formatDateTime(timestamp: number) {
  if (timestamp <= 0) return "—";
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
