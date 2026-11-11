"use client";

import { shortAddress } from "@/lib/format";
import { Avatar } from "./Avatar";
import { WalletIcon } from "./icons";
import { useProfile } from "./ProfileProvider";

/** The avatar, name and one-line status of the connected wallet. Used by the header and the sidebar. */
export function useIdentity() {
  const { account, restaurant } = useProfile();

  return {
    name: restaurant ? restaurant.name : "Customer",
    detail: restaurant ? (restaurant.isActive ? "Authorized" : "Paused") : shortAddress(account),
    avatar: restaurant ? (
      <Avatar seed={account} label={restaurant.name} size="lg" />
    ) : (
      <Avatar seed={account} size="lg">
        <WalletIcon className="h-5 w-5" />
      </Avatar>
    ),
  };
}

/** Small card at the bottom of the sidebar. */
export function IdentityCard() {
  const { name, detail, avatar } = useIdentity();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] p-3">
      {avatar}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{name}</p>
        <p className="truncate text-xs text-[#F07340]">{detail}</p>
      </div>
    </div>
  );
}
