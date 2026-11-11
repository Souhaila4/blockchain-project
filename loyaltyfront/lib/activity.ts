import type { EventLog } from "ethers";
import { market, node, read, reader } from "./chain";
import { REGISTRY_DEPLOY_BLOCK } from "./config";
import type { Restaurant } from "./contracts";
import { getMenu, getRewards, type MenuItem, type RewardOffer } from "./market";

/** History for the dashboards and the Transactions page, read from the market's events. */

/** `purchase`: a customer bought something and earned points. `reward`: a customer spent points on a reward. */
export type ActivityKind = "purchase" | "reward";

export type Activity = {
  id: string;
  kind: ActivityKind;
  /** The other side: the customer for a restaurant, the restaurant for a customer. */
  counterparty: string;
  /** The restaurant name when `counterparty` is a restaurant. */
  counterpartyName: string | null;
  /** What was bought or claimed, for example "2 × Latte". */
  detail: string;
  /** Points earned by a purchase, or spent on a reward. */
  points: bigint;
  /** Money paid, in wei. Zero for rewards. */
  paid: bigint;
  /** Symbol of the token that was earned or spent. */
  symbol: string;
  /** Block time, in seconds. */
  timestamp: number;
};

type RawActivity = Omit<Activity, "id" | "timestamp"> & {
  blockNumber: number;
  index: number;
  transactionHash: string;
};

const blockTimes = new Map<number, number>();

/** Block times never change, so each block is asked for once. */
async function loadBlockTimes(blockNumbers: number[]) {
  const missing = [...new Set(blockNumbers)].filter((number) => !blockTimes.has(number));
  await Promise.all(
    missing.map(async (number) => {
      const block = await node().getBlock(number);
      if (block) blockTimes.set(number, block.timestamp);
    }),
  );
}

/** Newest first, with block times attached. */
async function toActivities(raw: RawActivity[]): Promise<Activity[]> {
  await loadBlockTimes(raw.map((item) => item.blockNumber));

  return [...raw]
    .sort((a, b) => b.blockNumber - a.blockNumber || b.index - a.index)
    .map(({ blockNumber, index, transactionHash, ...activity }) => ({
      ...activity,
      id: `${transactionHash}-${index}`,
      timestamp: blockTimes.get(blockNumber) ?? 0,
    }));
}

type Catalog = { items: MenuItem[]; rewards: RewardOffer[] };

/** Events only hold ids. Names never change, so they are read from each restaurant's current menu. */
async function loadCatalogs(restaurants: string[]) {
  const unique = [...new Set(restaurants)];
  const entries = await Promise.all(
    unique.map(async (address): Promise<[string, Catalog]> => [
      address,
      { items: await getMenu(address), rewards: await getRewards(address) },
    ]),
  );
  return new Map(entries);
}

function describePurchase(catalog: Catalog | undefined, itemId: number, quantity: number) {
  const name = catalog?.items[itemId]?.name ?? `Item #${itemId}`;
  return quantity === 1 ? name : `${quantity} × ${name}`;
}

function describeReward(catalog: Catalog | undefined, rewardId: number) {
  return catalog?.rewards[rewardId]?.name ?? `Reward #${rewardId}`;
}

/** The points symbol of a token address, and the name of a restaurant address. */
function lookups(restaurants: Restaurant[]) {
  return {
    names: new Map(restaurants.map((restaurant) => [restaurant.address, restaurant.name])),
    symbolByToken: new Map(restaurants.map((restaurant) => [restaurant.token, restaurant.symbol])),
    symbolByRestaurant: new Map(restaurants.map((restaurant) => [restaurant.address, restaurant.symbol])),
  };
}

function toRaw(
  kind: ActivityKind,
  log: EventLog,
  fields: Pick<RawActivity, "counterparty" | "counterpartyName" | "detail" | "points" | "paid" | "symbol">,
): RawActivity {
  return {
    kind,
    ...fields,
    blockNumber: log.blockNumber,
    index: log.index,
    transactionHash: log.transactionHash,
  };
}

/** What happened at `restaurant`: purchases made there, and rewards claimed there (with any accepted token). */
export async function getRestaurantActivity(
  restaurant: Restaurant,
  restaurants: Restaurant[],
): Promise<Activity[]> {
  return read(async () => {
    const { names, symbolByToken } = lookups(restaurants);
    const contract = await market(reader());

    const [purchases, claims, catalogs] = await Promise.all([
      contract.queryFilter(contract.filters.Purchased(restaurant.address), REGISTRY_DEPLOY_BLOCK),
      contract.queryFilter(contract.filters.RewardClaimed(restaurant.address), REGISTRY_DEPLOY_BLOCK),
      loadCatalogs([restaurant.address]),
    ]);
    const catalog = catalogs.get(restaurant.address);

    const raw: RawActivity[] = [
      ...purchases.map((entry) => {
        const log = entry as EventLog;
        const customer = String(log.args.customer);
        return toRaw("purchase", log, {
          counterparty: customer,
          counterpartyName: names.get(customer) ?? null,
          detail: describePurchase(catalog, Number(log.args.itemId), Number(log.args.quantity)),
          points: BigInt(log.args.points),
          paid: BigInt(log.args.paid),
          symbol: restaurant.symbol,
        });
      }),
      ...claims.map((entry) => {
        const log = entry as EventLog;
        const customer = String(log.args.customer);
        return toRaw("reward", log, {
          counterparty: customer,
          counterpartyName: names.get(customer) ?? null,
          detail: describeReward(catalog, Number(log.args.rewardId)),
          points: BigInt(log.args.points),
          paid: BigInt(0),
          symbol: symbolByToken.get(String(log.args.token)) ?? "",
        });
      }),
    ];

    return toActivities(raw);
  });
}

/** What happened to `user`: purchases it made, and rewards it claimed. */
export async function getCustomerActivity(
  user: string,
  restaurants: Restaurant[],
): Promise<Activity[]> {
  return read(async () => {
    const { names, symbolByToken, symbolByRestaurant } = lookups(restaurants);
    const contract = await market(reader());

    const [purchases, claims] = await Promise.all([
      contract.queryFilter(contract.filters.Purchased(null, user), REGISTRY_DEPLOY_BLOCK),
      contract.queryFilter(contract.filters.RewardClaimed(null, user), REGISTRY_DEPLOY_BLOCK),
    ]);
    const logs = [...purchases, ...claims] as EventLog[];
    const catalogs = await loadCatalogs(logs.map((log) => String(log.args.restaurant)));

    const raw: RawActivity[] = [
      ...(purchases as EventLog[]).map((log) => {
        const place = String(log.args.restaurant);
        return toRaw("purchase", log, {
          counterparty: place,
          counterpartyName: names.get(place) ?? null,
          detail: describePurchase(catalogs.get(place), Number(log.args.itemId), Number(log.args.quantity)),
          points: BigInt(log.args.points),
          paid: BigInt(log.args.paid),
          symbol: symbolByRestaurant.get(place) ?? "",
        });
      }),
      ...(claims as EventLog[]).map((log) => {
        const place = String(log.args.restaurant);
        return toRaw("reward", log, {
          counterparty: place,
          counterpartyName: names.get(place) ?? null,
          detail: describeReward(catalogs.get(place), Number(log.args.rewardId)),
          points: BigInt(log.args.points),
          paid: BigInt(0),
          symbol: symbolByToken.get(String(log.args.token)) ?? "",
        });
      }),
    ];

    return toActivities(raw);
  });
}
