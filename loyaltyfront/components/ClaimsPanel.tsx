"use client";

import { useCallback } from "react";
import { describeTransactionError } from "@/lib/errors";
import { formatPoints, shortAddress } from "@/lib/format";
import {
  cancelClaim,
  fulfillClaim,
  getCustomerClaims,
  getRestaurantClaims,
  getRewards,
  type Claim,
} from "@/lib/market";
import { ActionButton, FormMessage, LoadState } from "./ui";
import { useAction } from "./useAction";
import { useLoad } from "./useLoad";

/**
 * Reward claims. An owner sees the claims on their rewards and marks them handed over (or cancels them).
 * A customer sees their own claims and can cancel one that is still pending to get the points back.
 */
export function ClaimsPanel({ role, address }: { role: "owner" | "customer"; address: string }) {
  const load = useCallback(async () => {
    const claims =
      role === "owner" ? await getRestaurantClaims(address) : await getCustomerClaims(address);
    const restaurants = [...new Set(claims.map((claim) => claim.restaurant))];
    const catalogs = new Map(
      await Promise.all(
        restaurants.map(async (restaurant) => [restaurant, await getRewards(restaurant)] as const),
      ),
    );
    return { claims, catalogs };
  }, [role, address]);
  const { data, error, loading, reload } = useLoad(load);

  return (
    <div className="space-y-3">
      <LoadState loading={loading} error={error} />
      {data && data.claims.length === 0 ? (
        <p className="text-sm text-white/60">No claims yet.</p>
      ) : null}
      {data && data.claims.length > 0 ? (
        <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.07]">
          {data.claims.map((claim) => (
            <ClaimRow
              key={claim.id}
              claim={claim}
              role={role}
              rewardName={
                data.catalogs.get(claim.restaurant)?.[claim.rewardId]?.name ?? `Reward #${claim.rewardId}`
              }
              onChanged={reload}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ClaimRow({
  claim,
  role,
  rewardName,
  onChanged,
}: {
  claim: Claim;
  role: "owner" | "customer";
  rewardName: string;
  onChanged: () => void;
}) {
  const { pending, error, run } = useAction(describeTransactionError);
  const isPending = claim.status === "pending";

  async function act(task: () => Promise<void>) {
    if (await run(task)) onChanged();
  }

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-white">{rewardName}</p>
          <p className="mt-0.5 text-xs text-white/55">
            {formatPoints(claim.points)} points ·{" "}
            {role === "owner"
              ? `by ${shortAddress(claim.customer)}`
              : `at ${shortAddress(claim.restaurant)}`}{" "}
            · <span className="capitalize">{claim.status}</span>
          </p>
        </div>
        {isPending ? (
          <div className="flex items-center">
            {role === "owner" ? (
              <ActionButton onClick={() => void act(() => fulfillClaim(claim.id))} disabled={pending}>
                {pending ? "Confirm in MetaMask…" : "Mark as handed over"}
              </ActionButton>
            ) : null}
            <ActionButton
              tone="ghost"
              onClick={() => void act(() => cancelClaim(claim.id))}
              disabled={pending}
            >
              Cancel and refund
            </ActionButton>
          </div>
        ) : null}
      </div>
      <FormMessage error={error} />
    </li>
  );
}
