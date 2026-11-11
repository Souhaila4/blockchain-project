"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { acceptanceLabel } from "@/lib/acceptance";
import { getRestaurantActivity } from "@/lib/activity";
import { getTokenSupply, type Restaurant } from "@/lib/contracts";
import { formatMoney, formatPoints, shortAddress } from "@/lib/format";
import { ActivityTable } from "./ActivityTable";
import { StarIcon } from "./icons";
import { useProfile } from "./ProfileProvider";
import { RangeChartCard } from "./RangeChartCard";
import { Card, LoadState, ViewAllLink } from "./ui";
import { useLoad } from "./useLoad";

const RECENT_ROWS = 5;

/** Home for a restaurant owner: points earned by customers over time, their activity, and the token at a glance. */
export function OwnerDashboard({ restaurant }: { restaurant: Restaurant }) {
  const { restaurants } = useProfile();

  const load = useCallback(async () => {
    const [activity, supply] = await Promise.all([
      getRestaurantActivity(restaurant, restaurants),
      getTokenSupply(restaurant.token),
    ]);
    return { activity, supply };
  }, [restaurant, restaurants]);
  const { data, error, loading } = useLoad(load);

  const purchases = useMemo(
    () => data?.activity.filter((activity) => activity.kind === "purchase") ?? [],
    [data],
  );
  const sales = useMemo(
    () => purchases.reduce((total, purchase) => total + purchase.paid, BigInt(0)),
    [purchases],
  );

  return (
    <div className="space-y-6">
      <RangeChartCard
        title="Total Points Awarded"
        caption="to customers"
        icon={<StarIcon className="h-[18px] w-[18px]" />}
        items={purchases}
      />

      <LoadState loading={loading} error={error} />

      {data ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card title="Customer Activity" action={<ViewAllLink href="/transactions" />}>
            <ActivityTable
              activities={data.activity.slice(0, RECENT_ROWS)}
              perspective="restaurant"
              emptyText="No activity yet. Customers earn points when they buy from your menu."
            />
          </Card>

          <Card title="Your Token" action={<ViewAllLink href="/restaurant">Manage</ViewAllLink>}>
            <dl className="space-y-4 text-sm">
              <Row label="Symbol" value={restaurant.symbol} />
              <Row label="Contract" value={shortAddress(restaurant.token)} mono />
              <Row label="In circulation" value={`${formatPoints(data.supply)} points`} />
              <Row label="Total sales" value={formatMoney(sales)} />
              <Row label="Accepts" value={acceptanceLabel(restaurant.mode)} />
            </dl>

            <Link
              href="/catalog"
              className="mt-6 block rounded-xl bg-[#F07340] px-4 py-2.5 text-center text-sm font-medium text-black"
            >
              Edit menu &amp; rewards
            </Link>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-white/55">{label}</dt>
      <dd className={`text-right text-white ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
