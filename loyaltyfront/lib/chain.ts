import {
  BrowserProvider,
  Contract,
  getAddress,
  JsonRpcProvider,
  type ContractRunner,
} from "ethers";
import { MARKET_ABI, REGISTRY_ABI, TOKEN_ABI } from "./abi";
import { CHAIN_ID, REGISTRY_ADDRESS, RPC_URL } from "./config";
import { requireEthereum } from "./wallet";

/** Shared access to the node and the contracts. The other `lib` files build on this. */

let readProvider: JsonRpcProvider | null = null;

export function node(): JsonRpcProvider {
  readProvider ??= new JsonRpcProvider(RPC_URL, CHAIN_ID, { staticNetwork: true });
  return readProvider;
}

/** Reads go straight to the node, so lists work even before MetaMask is connected. */
export function reader(): ContractRunner {
  return node();
}

/** Writes are signed by the account selected in MetaMask. */
export async function signer(): Promise<ContractRunner> {
  return new BrowserProvider(requireEthereum()).getSigner();
}

export function registry(runner: ContractRunner) {
  return new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, runner);
}

export function token(address: string, runner: ContractRunner) {
  return new Contract(address, TOKEN_ABI, runner);
}

let pendingMarketAddress: Promise<string> | null = null;

/** The registry created the market, so its address is asked from the registry once. */
function marketAddress() {
  pendingMarketAddress ??= registry(reader())
    .market()
    .then((address: string) => getAddress(address))
    .catch((error: unknown) => {
      pendingMarketAddress = null; // Do not remember a failure, for example Ganache being down.
      throw error;
    });
  return pendingMarketAddress;
}

export async function market(runner: ContractRunner) {
  return new Contract(await marketAddress(), MARKET_ABI, runner);
}

export async function read<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch {
    throw new Error("Could not read the blockchain. Check that Ganache is running at " + RPC_URL + ".");
  }
}
