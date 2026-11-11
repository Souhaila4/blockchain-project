import { getAddress, ZeroAddress, type EventLog } from "ethers";
import { toAcceptanceMode, type AcceptanceMode } from "./acceptance";
import { read, reader, registry, signer, token } from "./chain";
import { REGISTRY_DEPLOY_BLOCK } from "./config";

/** Restaurants, their tokens and acceptance policies: the `RestaurantRegistry` and `RestaurantToken` side. */

export type Restaurant = {
  address: string;
  name: string;
  location: string;
  /** The restaurant's own ERC-20 token. */
  token: string;
  symbol: string;
  isActive: boolean;
  mode: AcceptanceMode;
};

/** What one wallet holds, and has already spent, of one restaurant's token. */
export type Holding = {
  restaurant: Restaurant;
  balance: bigint;
  spent: bigint;
};

export type NewRestaurant = {
  name: string;
  location: string;
  symbol: string;
  mode: AcceptanceMode;
  /** Addresses of the restaurants whose tokens are accepted. Only used with `SelectedPartners`. */
  partners: string[];
};

/** Returns the restaurant registered by `address`, or null when there is none. */
async function getRestaurant(address: string): Promise<Restaurant | null> {
  const record = await registry(reader()).restaurants(address);
  const tokenAddress = String(record.token);
  if (tokenAddress === ZeroAddress) return null;

  return {
    address: getAddress(address),
    name: String(record.name),
    location: String(record.location),
    token: getAddress(tokenAddress),
    symbol: String(await token(tokenAddress, reader()).symbol()),
    isActive: Boolean(record.isActive),
    mode: toAcceptanceMode(record.mode),
  };
}

/** Lists every registered restaurant, oldest first, from the `RestaurantRegistered` events. */
export async function listRestaurants(): Promise<Restaurant[]> {
  return read(async () => {
    const contract = registry(reader());
    const logs = await contract.queryFilter(
      contract.filters.RestaurantRegistered(),
      REGISTRY_DEPLOY_BLOCK,
    );

    const restaurants = await Promise.all(
      logs.map((log) => getRestaurant(String((log as EventLog).args.restaurantAddress))),
    );
    return restaurants.filter((restaurant): restaurant is Restaurant => restaurant !== null);
  });
}

/** Tokens `user` holds or has spent. Tokens the wallet never touched are left out. */
export async function getHoldings(user: string, restaurants: Restaurant[]): Promise<Holding[]> {
  return read(async () => {
    const holdings = await Promise.all(
      restaurants.map(async (restaurant) => {
        const contract = token(restaurant.token, reader());
        const [balance, spent] = await Promise.all([
          contract.balanceOf(user),
          contract.redeemedOf(user),
        ]);
        return { restaurant, balance: BigInt(balance), spent: BigInt(spent) };
      }),
    );
    return holdings.filter((holding) => holding.balance > BigInt(0) || holding.spent > BigInt(0));
  });
}

/** Points of `tokenAddress` still held by customers (created minus spent). */
export async function getTokenSupply(tokenAddress: string): Promise<bigint> {
  return read(async () => BigInt(await token(tokenAddress, reader()).totalSupply()));
}

/** Addresses of the `candidates` whose token `restaurantAddress` has chosen to accept. */
export async function getPartners(
  restaurantAddress: string,
  candidates: Restaurant[],
): Promise<string[]> {
  return read(async () => {
    const contract = registry(reader());
    const flags = await Promise.all(
      candidates.map((candidate) => contract.partners(restaurantAddress, candidate.address)),
    );
    return candidates.filter((_, index) => Boolean(flags[index])).map((candidate) => candidate.address);
  });
}

export async function registerRestaurant(input: NewRestaurant) {
  const contract = registry(await signer());
  const tx = await contract.registerRestaurant(
    input.name.trim(),
    input.location.trim(),
    input.symbol.trim(),
    input.mode,
    input.partners.map((partner) => getAddress(partner)),
  );
  await tx.wait();
}

export async function setRestaurantActive(isActive: boolean) {
  const contract = registry(await signer());
  const tx = await contract.setRestaurantStatus(isActive);
  await tx.wait();
}

export async function setAcceptanceMode(mode: AcceptanceMode) {
  const contract = registry(await signer());
  const tx = await contract.setAcceptanceMode(mode);
  await tx.wait();
}

export async function setPartner(partner: string, accepted: boolean) {
  const contract = registry(await signer());
  const tx = await contract.setPartner(getAddress(partner), accepted);
  await tx.wait();
}
