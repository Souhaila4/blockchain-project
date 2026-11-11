"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { getCustomerActivity } from "@/lib/activity";
import { getHoldings } from "@/lib/contracts";
import { formatPoints } from "@/lib/format";
import { ClaimsPanel } from "./ClaimsPanel";
import { ActivityTable } from "./ActivityTable";
import { ChevronRightIcon, StarIcon } from "./icons";
import { useProfile } from "./ProfileProvider";
import { RangeChartCard } from "./RangeChartCard";
import { Card, LoadState, ViewAllLink } from "./ui";
import { useLoad } from "./useLoad";

const RECENT_ROWS = 5;
const TOKEN_ROWS = 4;

/** Home for a customer: points earned from purchases over time, recent activity, and the tokens they hold. */
export function CustomerDashboard() {
  const { account, restaurants } = useProfile();

  const load = useCallback(async () => {
    const [activity, holdings] = await Promise.all([
      getCustomerActivity(account, restaurants),
      getHoldings(account, restaurants),
    ]);
    return { activity, holdings };
  }, [account, restaurants]);
  const { data, error, loading } = useLoad(load);

  const earned = useMemo(
    () => data?.activity.filter((activity) => activity.kind === "purchase") ?? [],
    [data],
  );
  const held = useMemo(
    () =>
      (data?.holdings ?? [])
        .filter((holding) => holding.balance > BigInt(0))
        .sort((a, b) => (a.balance < b.balance ? 1 : -1))
        .slice(0, TOKEN_ROWS),
    [data],
  );

  return (
    <div className="space-y-6">
      <RangeChartCard
        title="Total Points Earned"
        caption="from your purchases"
        icon={<StarIcon className="h-[18px] w-[18px]" />}
        items={earned}
      />

      <LoadState loading={loading} error={error} />

      <Card title="My reward claims">
        <ClaimsPanel role="customer" address={account} />
      </Card>

      {data ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card title="Recent Activity" action={<ViewAllLink href="/transactions" />}>
            <ActivityTable
              activities={data.activity.slice(0, RECENT_ROWS)}
              perspective="customer"
              emptyText="No activity yet. Buy something at a restaurant to start earning points."
            />
          </Card>

          <Card title="My Tokens" action={<ViewAllLink href="/points" />}>
            {held.length === 0 ? (
              <div className="space-y-3 text-sm text-white/60">
                <p>You do not hold any points yet.</p>
                <Link href="/restaurants" className="text-[#F07340] hover:underline">
                  Browse restaurants
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {held.map(({ restaurant, balance }) => (
                  <li key={restaurant.token}>
                    <Link
                      href={`/restaurants/${restaurant.address}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-white">{restaurant.name}</span>
                        <span className="block text-xs text-white/55">
                          {formatPoints(balance)} {restaurant.symbol}
                        </span>
                      </span>
                      <ChevronRightIcon className="h-4 w-4 shrink-0 text-white/40" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
