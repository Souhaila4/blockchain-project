"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { listRestaurants, type Restaurant } from "@/lib/contracts";
import { useLoad } from "./useLoad";
import { ActionButton } from "./ui";

export type Role = "owner" | "customer";

type Profile = {
  account: string;
  /** Owners have a restaurant registered at their address. Everyone else is a customer. */
  role: Role;
  /** The restaurant of this wallet, or null for customers. */
  restaurant: Restaurant | null;
  /** Every restaurant on the registry. */
  restaurants: Restaurant[];
  /** Fetches the profile again, for example after a restaurant was created or changed. */
  reload: () => void;
};

const ProfileContext = createContext<Profile | null>(null);

/**
 * Works out who the connected wallet is from the registry: a restaurant owner when a restaurant is
 * registered at its address, a customer otherwise. Children render only once that is known.
 * Mount it with `key={account}` so switching wallets starts from a clean state.
 */
export function ProfileProvider({ account, children }: { account: string; children: ReactNode }) {
  const load = useCallback(() => listRestaurants(), []);
  const { data: restaurants, error, reload } = useLoad(load);

  const restaurant = useMemo(
    () => restaurants?.find((candidate) => candidate.address === account) ?? null,
    [restaurants, account],
  );

  const profile = useMemo<Profile | null>(
    () =>
      restaurants
        ? {
            account,
            role: restaurant ? "owner" : "customer",
            restaurant,
            restaurants,
            reload,
          }
        : null,
    [account, restaurant, restaurants, reload],
  );

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-sm text-sm text-red-300">{error}</p>
        <ActionButton onClick={reload}>Try again</ActionButton>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-white/60">
        Loading your profile…
      </div>
    );
  }

  return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used inside <ProfileProvider>.");
  return context;
}
