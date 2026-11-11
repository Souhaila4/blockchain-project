"use client";

import { useCallback } from "react";
import { getMenu, getRewards } from "@/lib/market";
import { ClaimsPanel } from "./ClaimsPanel";
import { MenuEditor } from "./MenuEditor";
import { useProfile } from "./ProfileProvider";
import { RewardEditor } from "./RewardEditor";
import { RoleGate } from "./RoleGate";
import { Card, LoadState, PageHeading } from "./ui";
import { useLoad } from "./useLoad";

/** Where an owner builds the menu and the rewards that customers see on the restaurant's page. */
export function CatalogManager() {
  const { restaurant } = useProfile();

  return (
    <RoleGate role="owner" redirectTo="/create">
      {restaurant ? (
        <Catalog address={restaurant.address} symbol={restaurant.symbol} />
      ) : null}
    </RoleGate>
  );
}

function Catalog({ address, symbol }: { address: string; symbol: string }) {
  const load = useCallback(
    async () => {
      const [items, rewards] = await Promise.all([getMenu(address), getRewards(address)]);
      return { items, rewards };
    },
    [address],
  );
  const { data, error, loading, reload } = useLoad(load);

  return (
    <div className="space-y-5">
      <PageHeading
        title="Menu & rewards"
        description={`Customers pay for items and earn ${symbol} points. They spend those points on your rewards.`}
      />

      <LoadState loading={loading} error={error} />

      {data ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Menu">
            <MenuEditor items={data.items} onChanged={reload} />
          </Card>
          <Card title="Rewards">
            <RewardEditor rewards={data.rewards} symbol={symbol} onChanged={reload} />
          </Card>
          <Card title="Reward claims">
            <ClaimsPanel role="owner" address={address} />
          </Card>
        </div>
      ) : null}
    </div>
  );
}
