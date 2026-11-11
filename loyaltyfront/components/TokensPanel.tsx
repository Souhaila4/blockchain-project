"use client";

import { useCallback } from "react";
import Link from "next/link";
import { getHoldings, type Holding } from "@/lib/contracts";
import { formatPoints } from "@/lib/format";
import { ChevronRightIcon } from "./icons";
import { useProfile } from "./ProfileProvider";
import { Card, EmptyState, LoadState } from "./ui";
import { useLoad } from "./useLoad";

/** The tokens this wallet holds and has spent. Spending happens on a restaurant's page, as a reward. */
export function TokensPanel() {
  const { account, restaurants } = useProfile();

  const load = useCallback(() => getHoldings(account, restaurants), [account, restaurants]);
  const { data: holdings, error, loading } = useLoad(load);

  return (
    <div className="grid max-w-2xl gap-6">
      <LoadState loading={loading} error={error} />

      {holdings ? (
        <Card title="My tokens">
          <HoldingList holdings={holdings} />
        </Card>
      ) : null}
    </div>
  );
}

function HoldingList({ holdings }: { holdings: Holding[] }) {
  if (holdings.length === 0) {
    return (
      <EmptyState
        mood="wink"
        action={
          <Link href="/restaurants" className="text-sm text-[#F07340] hover:underline">
            Browse restaurants
          </Link>
        }
      >
        You have no points yet. You earn points every time you buy from a restaurant.
      </EmptyState>
    );
  }

  return (
    <ul className="space-y-3">
      {holdings.map(({ restaurant, balance, spent }) => (
        <li key={restaurant.token}>
          <Link
            href={`/restaurants/${restaurant.address}`}
            className="block rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:bg-white/[0.06]"
          >
            <p className="flex items-center justify-between gap-3 text-sm font-medium text-white">
              <span className="min-w-0 truncate">
                {restaurant.name}
                <span className="ml-2 text-xs font-normal text-white/55">{restaurant.symbol}</span>
              </span>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-white/40" />
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-white/55">Points you can spend</dt>
                <dd className="mt-1 text-2xl font-medium text-white">{formatPoints(balance)}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/55">Points already spent</dt>
                <dd className="mt-1 text-2xl font-medium text-white">{formatPoints(spent)}</dd>
              </div>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  );
}
