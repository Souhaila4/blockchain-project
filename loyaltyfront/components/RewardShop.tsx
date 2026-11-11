"use client";

import { useState } from "react";
import type { Holding, Restaurant } from "@/lib/contracts";
import { describeTransactionError } from "@/lib/errors";
import { formatPoints } from "@/lib/format";
import { claimReward, UNLIMITED_STOCK, type RewardOffer } from "@/lib/market";
import { ActionButton, FormMessage, SelectField } from "./ui";
import { useAction } from "./useAction";

/**
 * What a customer can get for points. `accepted` holds the customer's non-empty balances
 * that this restaurant takes right now, so the customer only sees tokens that can work.
 */
export function RewardShop({
  restaurant,
  rewards,
  accepted,
  canClaim,
  onClaimed,
}: {
  restaurant: Restaurant;
  rewards: RewardOffer[];
  accepted: Holding[];
  canClaim: boolean;
  onClaimed: () => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const { pending, error, success, run } = useAction(describeTransactionError);

  const available = rewards.filter((reward) => reward.isActive);
  if (available.length === 0) {
    return <p className="text-sm text-white/60">This restaurant has no rewards yet.</p>;
  }

  // Prefer the restaurant's own token, then the first one the customer holds.
  const selected =
    accepted.find((holding) => holding.restaurant.token === chosen) ??
    accepted.find((holding) => holding.restaurant.token === restaurant.token) ??
    accepted[0] ??
    null;

  async function claim(reward: RewardOffer) {
    if (!selected) return;
    const token = selected.restaurant.token;
    const claimed = await run(
      () => claimReward({ restaurant: restaurant.address, rewardId: reward.id, token, maxCost: reward.cost }),
      `${reward.name} claimed for ${formatPoints(reward.cost)} ${selected.restaurant.symbol}. The restaurant will hand it over.`,
    );
    if (claimed) onClaimed();
  }

  return (
    <div className="space-y-4">
      {accepted.length > 0 ? (
        <SelectField
          label="Pay with"
          value={selected?.restaurant.token ?? ""}
          disabled={pending}
          onChange={setChosen}
        >
          {accepted.map(({ restaurant: issuer, balance }) => (
            <option key={issuer.token} value={issuer.token}>
              {issuer.name} · {formatPoints(balance)} {issuer.symbol}
            </option>
          ))}
        </SelectField>
      ) : (
        <p className="text-sm text-white/60">
          You have no points that {restaurant.name} accepts yet. Buy something to earn some.
        </p>
      )}

      <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.07]">
        {available.map((reward) => {
          const enough = selected !== null && selected.balance >= reward.cost;
          const soldOut = reward.stock === BigInt(0);
          return (
            <li key={reward.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-white">{reward.name}</p>
                <p className="mt-0.5 text-xs text-white/55">
                  {formatPoints(reward.cost)} points
                  {selected ? ` (${selected.restaurant.symbol})` : ""}
                  {reward.stock !== UNLIMITED_STOCK && !soldOut ? ` · ${reward.stock} left` : ""}
                </p>
              </div>
              {canClaim ? (
                <ActionButton onClick={() => void claim(reward)} disabled={pending || !enough || soldOut}>
                  {pending ? "Confirm in MetaMask…" : soldOut ? "Out of stock" : enough ? "Claim" : "Not enough points"}
                </ActionButton>
              ) : null}
            </li>
          );
        })}
      </ul>

      <FormMessage error={error} success={success} />
    </div>
  );
}
