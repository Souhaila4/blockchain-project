"use client";

import Link from "next/link";
import { acceptanceLabel } from "@/lib/acceptance";
import { shortAddress } from "@/lib/format";
import { Avatar } from "./Avatar";
import { ChevronRightIcon, PinIcon } from "./icons";
import { useProfile } from "./ProfileProvider";

/** Every restaurant on the registry. Each card opens that restaurant's menu and rewards. */
export function RestaurantDirectory() {
  const { account, restaurants } = useProfile();

  if (restaurants.length === 0) {
    return <p className="text-sm text-white/60">No restaurant has been created yet.</p>;
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {restaurants.map((restaurant) => (
        <li key={restaurant.address}>
          <Link
            href={`/restaurants/${restaurant.address}`}
            className="block h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.06] motion-reduce:transition-none"
          >
            <div className="flex items-start gap-3">
              <Avatar seed={restaurant.address} label={restaurant.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="truncate text-base font-medium text-white">{restaurant.name}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${
                      restaurant.isActive
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {restaurant.isActive ? "Authorized" : "Paused"}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-white/55">
                  <PinIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{restaurant.location}</span>
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-1.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-white/45">Token</dt>
                <dd className="text-white/80">{restaurant.symbol}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-white/45">Accepts</dt>
                <dd className="text-right text-white/80">{acceptanceLabel(restaurant.mode)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-white/45">Wallet</dt>
                <dd className="font-mono text-white/80">
                  {shortAddress(restaurant.address)}
                  {restaurant.address === account ? " · you" : ""}
                </dd>
              </div>
            </dl>

            <p className="mt-4 flex items-center gap-1 text-xs text-[#F07340]">
              View menu &amp; rewards
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
