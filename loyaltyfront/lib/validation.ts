import { parseUnits } from "ethers";
import {
  CURRENCY,
  MAX_ITEM_NAME_LENGTH,
  MAX_LOCATION_LENGTH,
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
} from "./config";
import { UNLIMITED_STOCK } from "./market";

/** Largest values the contract stores: `uint128` for prices, `uint64` for points. */
const MAX_UINT128 = (BigInt(1) << BigInt(128)) - BigInt(1);
const MAX_UINT64 = (BigInt(1) << BigInt(64)) - BigInt(1);

/** Either the parsed value, or the message to show next to the form. */
export type Parsed<T> = { value: T; error: null } | { value: null; error: string };

function fail(error: string): { value: null; error: string } {
  return { value: null, error };
}

export function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

export function validateRestaurant(input: { name: string; location: string; symbol: string }) {
  const nameLength = byteLength(input.name.trim());
  const locationLength = byteLength(input.location.trim());
  const symbolLength = byteLength(input.symbol.trim());

  if (nameLength === 0) return "Name is required.";
  if (nameLength > MAX_NAME_LENGTH) return `Name is too long. Keep it within ${MAX_NAME_LENGTH} bytes.`;
  if (locationLength === 0) return "Location is required.";
  if (locationLength > MAX_LOCATION_LENGTH) {
    return `Location is too long. Keep it within ${MAX_LOCATION_LENGTH} bytes.`;
  }
  if (symbolLength === 0) return "Token symbol is required.";
  if (symbolLength > MAX_SYMBOL_LENGTH) {
    return `Token symbol is too long. Keep it within ${MAX_SYMBOL_LENGTH} bytes.`;
  }
  return null;
}

function parseName(value: string, what: string): Parsed<string> {
  const name = value.trim();
  const length = byteLength(name);

  if (length === 0) return fail(`${what} name is required.`);
  if (length > MAX_ITEM_NAME_LENGTH) {
    return fail(`${what} name is too long. Keep it within ${MAX_ITEM_NAME_LENGTH} bytes.`);
  }
  return { value: name, error: null };
}

/** A price typed in the chain's currency, for example "0.015". Returns wei. */
export function parsePrice(text: string): Parsed<bigint> {
  const trimmed = text.trim();
  const message = `Enter a price in ${CURRENCY} greater than zero, for example 0.01.`;
  if (!/^\d+(\.\d{1,18})?$/.test(trimmed)) return fail(message);

  const wei = parseUnits(trimmed, 18);
  if (wei === BigInt(0)) return fail(message);
  if (wei > MAX_UINT128) return fail("That price is too large.");
  return { value: wei, error: null };
}

/** Whole points. Zero is allowed when `allowZero` is set, for items that earn nothing. */
export function parsePointsAmount(text: string, allowZero: boolean): Parsed<bigint> {
  const trimmed = text.trim();
  const message = allowZero
    ? "Enter the points as a whole number. Use 0 for none."
    : "Enter a whole number of points greater than zero.";
  if (!/^\d+$/.test(trimmed)) return fail(message);

  const points = BigInt(trimmed);
  if (points === BigInt(0) && !allowZero) return fail(message);
  if (points > MAX_UINT64) return fail("That number of points is too large.");
  return { value: points, error: null };
}

export type ItemInput = { name: string; price: string; points: string };
export type ParsedItem = { name: string; price: bigint; points: bigint };

export function parseItem(input: ItemInput): Parsed<ParsedItem> {
  const name = parseName(input.name, "Item");
  if (name.error !== null) return fail(name.error);
  const price = parsePrice(input.price);
  if (price.error !== null) return fail(price.error);
  const points = parsePointsAmount(input.points, true);
  if (points.error !== null) return fail(points.error);

  return { value: { name: name.value, price: price.value, points: points.value }, error: null };
}

export type RewardInput = { name: string; cost: string; stock: string };
export type ParsedReward = { name: string; cost: bigint; stock: bigint };

/** Empty means no limit. Otherwise a whole number of units, below the "unlimited" marker. */
export function parseStock(text: string): Parsed<bigint> {
  const trimmed = text.trim();
  if (trimmed === "") return { value: UNLIMITED_STOCK, error: null };
  if (!/^\d+$/.test(trimmed)) return fail("Enter the stock as a whole number, or leave it empty for no limit.");
  const stock = BigInt(trimmed);
  if (stock >= UNLIMITED_STOCK) return fail("That stock is too large. Leave it empty for no limit.");
  return { value: stock, error: null };
}

export function parseReward(input: RewardInput): Parsed<ParsedReward> {
  const name = parseName(input.name, "Reward");
  if (name.error !== null) return fail(name.error);
  const cost = parsePointsAmount(input.cost, false);
  if (cost.error !== null) return fail(cost.error);
  const stock = parseStock(input.stock);
  if (stock.error !== null) return fail(stock.error);

  return { value: { name: name.value, cost: cost.value, stock: stock.value }, error: null };
}
