import { errorInterfaces } from "./abi";
import {
  CURRENCY,
  MAX_ITEMS,
  MAX_ITEM_NAME_LENGTH,
  MAX_LOCATION_LENGTH,
  MAX_NAME_LENGTH,
  MAX_REWARDS,
  MAX_SYMBOL_LENGTH,
} from "./config";
import { isRejected } from "./wallet";

export function describeConnectError(error: unknown) {
  if (isRejected(error)) return "Connection cancelled in MetaMask.";
  if (error instanceof Error && error.message) return error.message;
  return "Could not connect. Open MetaMask on LoyalChain Local and try again.";
}

/** One message per contract error, by error name. Works for the registry, the tokens and the market. */
const MESSAGES: Record<string, string> = {
  // RestaurantRegistry
  AlreadyRegistered: "This wallet already has a restaurant.",
  EmptyName: "A name is required.",
  EmptyLocation: "Location is required.",
  EmptySymbol: "Token symbol is required.",
  NameTooLong: `That name is too long. Keep it within ${MAX_NAME_LENGTH} bytes (${MAX_ITEM_NAME_LENGTH} for menu items and rewards).`,
  LocationTooLong: `Location is too long. Keep it within ${MAX_LOCATION_LENGTH} bytes.`,
  SymbolTooLong: `Token symbol is too long. Keep it within ${MAX_SYMBOL_LENGTH} bytes.`,
  NotRegistered: "Only a registered restaurant can do that.",
  StatusUnchanged: "The restaurant already has that status.",
  ModeUnchanged: "The restaurant already uses that setting.",
  PartnersNeedSelectedMode: "Pick restaurants only when you accept selected restaurants.",
  SelfPartner: "Your own token is always accepted. Pick other restaurants.",
  PartnerUnchanged: "That restaurant is already in that state.",
  // RestaurantMarket
  ZeroPrice: `Enter a price in ${CURRENCY} greater than zero.`,
  ZeroCost: "Enter a number of points greater than zero.",
  TooManyItems: `A menu can have at most ${MAX_ITEMS} items. Hide the ones you no longer sell.`,
  TooManyRewards: `A restaurant can have at most ${MAX_REWARDS} rewards. Hide the ones you no longer offer.`,
  UnknownItem: "That item does not exist.",
  UnknownReward: "That reward does not exist.",
  ItemUnavailable: "That item is not for sale right now.",
  RewardUnavailable: "That reward is not available right now.",
  ZeroQuantity: "Choose at least one.",
  SelfPurchase: "A restaurant cannot buy from itself.",
  RestaurantNotActive: "This restaurant is paused and cannot sell right now.",
  WrongPayment: "The price changed. Reload the page and try again.",
  PaymentFailed: "The restaurant's wallet could not receive the payment.",
  NotAccepted: "This restaurant does not accept that token right now.",
  // RestaurantToken (and its ERC-20 base)
  NotMarket: "Points can only be created or spent through the market.",
  ERC20InsufficientBalance: "You don't have enough points.",
  ERC20InvalidReceiver: "That wallet address is not valid.",
  // Wallet
  INSUFFICIENT_FUNDS: `You don't have enough ${CURRENCY} for this.`,
};

const FALLBACK = "The transaction failed. Confirm LoyalChain Local is running and try again.";

/** Turns a failed transaction into a short message. */
export function describeTransactionError(error: unknown) {
  if (isRejected(error)) return "You cancelled the transaction in MetaMask.";

  const name = revertName(error);
  if (name && MESSAGES[name]) return MESSAGES[name];

  const code = asRecord(error)?.code;
  if (typeof code === "string" && MESSAGES[code]) return MESSAGES[code];

  // Plain errors thrown by our own code (not by the chain) are already readable.
  return error instanceof Error && !("code" in error) && error.message ? error.message : FALLBACK;
}

function revertName(error: unknown) {
  const record = asRecord(error);
  const revert = record && asRecord(record.revert);
  if (revert && typeof revert.name === "string") return revert.name;

  const data = findRevertData(error);
  if (!data) return null;

  for (const contractInterface of errorInterfaces) {
    try {
      const name = contractInterface.parseError(data)?.name;
      if (name) return name;
    } catch {
      // Try the next contract. The revert data belongs to only one of them.
    }
  }

  return null;
}

const REVERT_DATA_KEYS = ["data", "result", "error", "info", "originalError"] as const;
const HEX_DATA = /^0x[0-9a-fA-F]{8,}$/;

/**
 * Wallets nest the revert bytes differently: MetaMask puts them in `data`,
 * Ganache in `data.result`, and ethers wraps both in `error` or `info`.
 * The `transaction` key is skipped on purpose: it holds our own call data.
 */
function findRevertData(value: unknown, depth = 0): string | null {
  if (typeof value === "string") return HEX_DATA.test(value) ? value : null;
  if (depth > 5) return null;

  const record = asRecord(value);
  if (!record) return null;

  for (const key of REVERT_DATA_KEYS) {
    const found = findRevertData(record[key], depth + 1);
    if (found) return found;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null) return value as Record<string, unknown>;
  return null;
}
