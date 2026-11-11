"use client";

import { useCallback } from "react";
import Link from "next/link";
import { acceptanceLabel } from "@/lib/acceptance";
import { getHoldings } from "@/lib/contracts";
import { shortAddress } from "@/lib/format";
import { getAcceptedHoldings, getMenu, getRewards } from "@/lib/market";
import { Avatar } from "./Avatar";
import { PinIcon } from "./icons";
import { MenuShop } from "./MenuShop";
import { useProfile } from "./ProfileProvider";
import { RewardShop } from "./RewardShop";
import { Card, LoadState } from "./ui";
import { useLoad } from "./useLoad";

/** One restaurant: its menu to buy from, and its rewards to claim with points. */
export function RestaurantDetail({ address }: { address: string }) {
  const { account, restaurants } = useProfile();
  const restaurant = restaurants.find((candidate) => candidate.address === address) ?? null;

  const load = useCallback(async () => {
    if (!restaurant) return null;
    const [items, rewards, holdings] = await Promise.all([
      getMenu(restaurant.address),
      getRewards(restaurant.address),
      getHoldings(account, restaurants),
    ]);
    const accepted = await getAcceptedHoldings(restaurant.address, holdings);
    return { items, rewards, accepted };
  }, [account, restaurant, restaurants]);
  const { data, error, loading, reload } = useLoad(load);

  if (!restaurant) {
    return (
      <div className="space-y-3 text-sm text-white/60">
        <p>This restaurant is not registered on LoyalChain.</p>
        <Link href="/restaurants" className="text-[#F07340] hover:underline">
          Back to restaurants
        </Link>
      </div>
    );
  }

  const isOwn = restaurant.address === account;
  const open = restaurant.isActive;

  return (
    <div className="space-y-6">
      <Link href="/restaurants" className="text-xs text-white/60 hover:text-[#F07340]">
        ← All restaurants
      </Link>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar seed={restaurant.address} label={restaurant.name} />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-medium text-white">{restaurant.name}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/55">
                <PinIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{restaurant.location}</span>
              </p>
            </div>
          </div>

          <dl className="grid gap-x-8 gap-y-1 text-xs sm:grid-cols-[auto_auto]">
            <dt className="text-white/45">Token</dt>
            <dd className="text-white/80">{restaurant.symbol}</dd>
            <dt className="text-white/45">Accepts</dt>
            <dd className="text-white/80">{acceptanceLabel(restaurant.mode)}</dd>
            <dt className="text-white/45">Wallet</dt>
            <dd className="font-mono text-white/80">{shortAddress(restaurant.address)}</dd>
          </dl>
        </div>

        {isOwn ? (
          <p className="mt-4 rounded-xl bg-white/[0.05] px-4 py-3 text-sm text-white/70">
            This is your restaurant. This is what customers see.{" "}
            <Link href="/catalog" className="text-[#F07340] hover:underline">
              Edit menu &amp; rewards
            </Link>
          </p>
        ) : null}
        {open ? null : (
          <p className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            This restaurant is paused. Nobody can buy from it or claim its rewards right now.
          </p>
        )}
      </Card>

      <LoadState loading={loading} error={error} />

      {data ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Menu">
            <MenuShop
              restaurant={restaurant}
              items={data.items}
              canBuy={open && !isOwn}
              onPurchased={reload}
            />
          </Card>
          <Card title="Rewards">
            <RewardShop
              restaurant={restaurant}
              rewards={data.rewards}
              accepted={data.accepted}
              canClaim={open}
              onClaimed={reload}
            />
          </Card>
        </div>
      ) : null}
    </div>
  );
}
