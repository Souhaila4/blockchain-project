import { getAddress } from "ethers";
import { CHAIN_ID, CHAIN_ID_HEX, CHAIN_NAME, RPC_URL } from "./config";

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

const MISSING_METAMASK = "MetaMask is not installed in this browser.";

export function getEthereum(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;
  return ethereum ?? null;
}

export function requireEthereum(): EthereumProvider {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error(MISSING_METAMASK);
  return ethereum;
}

export function isLoyalChain(chainId: unknown) {
  if (typeof chainId !== "string") return false;
  try {
    return BigInt(chainId) === BigInt(CHAIN_ID);
  } catch {
    return false;
  }
}

const SIGNED_OUT_KEY = "loyalchain.signedOut";

/** Remembers that the user left on purpose, so an approved wallet does not sign them straight back in. */
function setSignedOut(value: boolean) {
  try {
    if (value) window.localStorage.setItem(SIGNED_OUT_KEY, "1");
    else window.localStorage.removeItem(SIGNED_OUT_KEY);
  } catch {
    // Storage can be blocked. Signing out then lasts until the page reloads.
  }
}

function isSignedOut() {
  try {
    return window.localStorage.getItem(SIGNED_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

/** Asks MetaMask for access, switches to LoyalChain Local, and returns the selected account. */
export async function connectWallet(): Promise<string> {
  const ethereum = requireEthereum();

  const accounts = toAccounts(await ethereum.request({ method: "eth_requestAccounts" }));
  await ensureLoyalChain(ethereum);

  if (!accounts[0]) throw new Error("No MetaMask account selected.");
  setSignedOut(false);
  return getAddress(accounts[0]);
}

/** Forgets the account in this app and, when MetaMask supports it, revokes the site's access. */
export async function disconnectWallet() {
  setSignedOut(true);

  try {
    await getEthereum()?.request({
      method: "wallet_revokePermissions",
      params: [{ eth_accounts: {} }],
    });
  } catch {
    // Older wallets cannot revoke. The signed-out flag already covers this app.
  }
}

/** Returns the already-approved account without opening MetaMask, or null. */
export async function restoreWallet(): Promise<string | null> {
  const ethereum = getEthereum();
  if (!ethereum || isSignedOut()) return null;

  try {
    const [accounts, chainId] = await Promise.all([
      ethereum.request({ method: "eth_accounts" }),
      ethereum.request({ method: "eth_chainId" }),
    ]);
    const [account] = toAccounts(accounts);
    return account && isLoyalChain(chainId) ? getAddress(account) : null;
  } catch {
    return null;
  }
}

export function toAccounts(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((account): account is string => typeof account === "string");
}

export function isRejected(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && (error.code === 4001 || error.code === "ACTION_REJECTED")) return true;
  if ("message" in error && typeof error.message === "string") {
    return error.message.toLowerCase().includes("user rejected");
  }
  return false;
}

async function ensureLoyalChain(ethereum: EthereumProvider) {
  if (isLoyalChain(await ethereum.request({ method: "eth_chainId" }))) return;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (error) {
    if (!isMissingChain(error)) throw error;
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CHAIN_ID_HEX,
          chainName: CHAIN_NAME,
          rpcUrls: [RPC_URL],
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        },
      ],
    });
  }

  if (!isLoyalChain(await ethereum.request({ method: "eth_chainId" }))) {
    throw new Error(`Switch MetaMask to ${CHAIN_NAME} (chain id ${CHAIN_ID}).`);
  }
}

function isMissingChain(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 4902;
}
