"use client";

import { useCallback } from "react";
import { getCustomerActivity, getRestaurantActivity } from "@/lib/activity";
import { ActivityTable } from "./ActivityTable";
import { useProfile } from "./ProfileProvider";
import { Card, LoadState } from "./ui";
import { useLoad } from "./useLoad";

/** Full history for the connected wallet: restaurant side for owners, customer side otherwise. */
export function TransactionsView() {
  const { account, restaurant, restaurants } = useProfile();

  const load = useCallback(
    () =>
      restaurant
        ? getRestaurantActivity(restaurant, restaurants)
        : getCustomerActivity(account, restaurants),
    [account, restaurant, restaurants],
  );
  const { data, error, loading } = useLoad(load);

  return (
    <Card>
      <LoadState loading={loading} error={error} />
      {data ? (
        <ActivityTable
          activities={data}
          perspective={restaurant ? "restaurant" : "customer"}
          emptyText="No transactions yet."
        />
      ) : null}
    </Card>
  );
}
