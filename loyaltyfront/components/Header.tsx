"use client";

import { PinIcon, ShieldCheckIcon } from "./icons";
import { useIdentity } from "./Identity";
import { useProfile } from "./ProfileProvider";
import { WalletChip } from "./WalletChip";

/** Who is signed in: the restaurant for owners, a plain "Customer" otherwise. */
export function Header() {
  const { restaurant } = useProfile();
  const { name, avatar } = useIdentity();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        {avatar}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-xl font-medium text-white">{name}</h1>
            {restaurant ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                  restaurant.isActive
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-amber-500/15 text-amber-300"
                }`}
              >
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                {restaurant.isActive ? "Authorized" : "Paused"}
              </span>
            ) : null}
          </div>
          {restaurant ? (
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-white/55">
              <PinIcon className="h-3.5 w-3.5 shrink-0" />
              {restaurant.location}
            </p>
          ) : (
            <p className="mt-1 text-xs text-white/55">Collect points and spend them at restaurants.</p>
          )}
        </div>
      </div>

      <WalletChip />
    </header>
  );
}
