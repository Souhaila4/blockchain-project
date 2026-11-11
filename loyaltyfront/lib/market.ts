import { getAddress } from "ethers";
import { REGISTRY_DEPLOY_BLOCK } from "./config";
import { market, read, reader, registry, signer } from "./chain";
import type { Holding } from "./contracts";

/** Menus, rewards, purchases and reward claims: the `RestaurantMarket` side. */

export type MenuItem = {
  /** Position in the restaurant's menu. This is the id the contract uses. */
  id: number;
  name: string;
  /** In wei, for one unit. */
  price: bigint;
  /** Points earned for one unit. */
  points: bigint;
  isActive: boolean;
};

export type RewardOffer = {
  id: number;
  name: string;
  /** Points needed. */
  cost: bigint;
  /** Units left, or `UNLIMITED_STOCK`. */
  stock: bigint;
  isActive: boolean;
};

/** Same value as `RestaurantMarket.UNLIMITED_STOCK`. */
export const UNLIMITED_STOCK = BigInt(4294967295);

export type ClaimStatus = "pending" | "fulfilled" | "cancelled";

export type Claim = {
  id: number;
  restaurant: string;
  customer: string;
  token: string;
  rewardId: number;
  points: bigint;
  status: ClaimStatus;
};

type RawClaim = {
  restaurant: string;
  customer: string;
  token: string;
  rewardId: bigint;
  points: bigint;
  status: bigint;
};

const CLAIM_STATUSES: ClaimStatus[] = ["pending", "fulfilled", "cancelled"];

function toClaim(id: number, raw: RawClaim): Claim {
  return {
    id,
    restaurant: getAddress(raw.restaurant),
    customer: getAddress(raw.customer),
    token: getAddress(raw.token),
    rewardId: Number(raw.rewardId),
    points: BigInt(raw.points),
    status: CLAIM_STATUSES[Number(raw.status)] ?? "pending",
  };
}

type RawItem = { name: string; price: bigint; points: bigint; isActive: boolean };
type RawReward = { name: string; cost: bigint; stock: bigint; isActive: boolean };

/** The whole menu of `restaurant`, hidden items included. */
export async function getMenu(restaurant: string): Promise<MenuItem[]> {
  return read(async () => {
    const items: RawItem[] = Array.from(await (await market(reader())).getItems(restaurant));
    return items.map((item, id) => ({
      id,
      name: String(item.name),
      price: BigInt(item.price),
      points: BigInt(item.points),
      isActive: Boolean(item.isActive),
    }));
  });
}

/** Every reward of `restaurant`, hidden ones included. */
export async function getRewards(restaurant: string): Promise<RewardOffer[]> {
  return read(async () => {
    const rewards: RawReward[] = Array.from(await (await market(reader())).getRewards(restaurant));
    return rewards.map((reward, id) => ({
      id,
      name: String(reward.name),
      cost: BigInt(reward.cost),
      stock: BigInt(reward.stock),
      isActive: Boolean(reward.isActive),
    }));
  });
}

/** The holdings that `restaurant` accepts for its rewards right now, and that are not empty. */
export async function getAcceptedHoldings(
  restaurant: string,
  holdings: Holding[],
): Promise<Holding[]> {
  return read(async () => {
    const contract = registry(reader());
    const candidates = holdings.filter((holding) => holding.balance > BigInt(0));
    const accepted = await Promise.all(
      candidates.map((holding) => contract.acceptsToken(restaurant, holding.restaurant.token)),
    );
    return candidates.filter((_, index) => Boolean(accepted[index]));
  });
}

export async function addMenuItem(input: { name: string; price: bigint; points: bigint }) {
  const contract = await market(await signer());
  const tx = await contract.addItem(input.name, input.price, input.points);
  await tx.wait();
}

export async function updateMenuItem(item: {
  id: number;
  price: bigint;
  points: bigint;
  isActive: boolean;
}) {
  const contract = await market(await signer());
  const tx = await contract.updateItem(item.id, item.price, item.points, item.isActive);
  await tx.wait();
}

export async function addReward(input: { name: string; cost: bigint; stock: bigint }) {
  const contract = await market(await signer());
  const tx = await contract.addReward(input.name, input.cost, input.stock);
  await tx.wait();
}

export async function updateReward(reward: {
  id: number;
  cost: bigint;
  stock: bigint;
  isActive: boolean;
}) {
  const contract = await market(await signer());
  const tx = await contract.updateReward(reward.id, reward.cost, reward.stock, reward.isActive);
  await tx.wait();
}

/** Pays `price * quantity` from the connected wallet. The restaurant gets the money, the buyer the points. */
export async function purchaseItem(input: { restaurant: string; item: MenuItem; quantity: number }) {
  const contract = await market(await signer());
  const value = input.item.price * BigInt(input.quantity);
  const tx = await contract.purchase(getAddress(input.restaurant), input.item.id, input.quantity, {
    value,
  });
  await tx.wait();
}

/**
 * Spends points of `token` on a reward of `restaurant`. `maxCost` is the cost the customer saw, so a
 * price change before the transaction is mined makes it fail instead of charging more.
 */
export async function claimReward(input: {
  restaurant: string;
  rewardId: number;
  token: string;
  maxCost: bigint;
}) {
  const contract = await market(await signer());
  const tx = await contract.claimReward(
    getAddress(input.restaurant),
    input.rewardId,
    getAddress(input.token),
    input.maxCost,
  );
  await tx.wait();
}

/** Restaurant only: the reward was handed over. */
export async function fulfillClaim(claimId: number) {
  const contract = await market(await signer());
  const tx = await contract.fulfill(claimId);
  await tx.wait();
}

/** Restaurant or customer: gives the points back and restores the stock. */
export async function cancelClaim(claimId: number) {
  const contract = await market(await signer());
  const tx = await contract.cancel(claimId);
  await tx.wait();
}

/** Every claim made by `customer`, newest first. */
export async function getCustomerClaims(customer: string): Promise<Claim[]> {
  return read(async () => {
    const result = await (await market(reader())).getCustomerClaims(customer);
    const ids: bigint[] = Array.from(result.ids);
    const claims: RawClaim[] = Array.from(result.claims);
    return claims.map((raw, index) => toClaim(Number(ids[index]), raw)).reverse();
  });
}

/** Every claim on the rewards of `restaurant`, newest first. Found through the claim events. */
export async function getRestaurantClaims(restaurant: string): Promise<Claim[]> {
  return read(async () => {
    const contract = await market(reader());
    const logs = await contract.queryFilter(
      contract.filters.RewardClaimed(restaurant),
      REGISTRY_DEPLOY_BLOCK,
    );
    const ids = logs.map((log) => Number((log as unknown as { args: { claimId: bigint } }).args.claimId));
    const claims = await Promise.all(
      ids.map(async (id) => toClaim(id, (await contract.getClaim(id)) as RawClaim)),
    );
    return claims.reverse();
  });
}
