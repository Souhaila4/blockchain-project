"use client";

import { CustomerDashboard } from "./CustomerDashboard";
import { OwnerDashboard } from "./OwnerDashboard";
import { useProfile } from "./ProfileProvider";

/** The main menu: the restaurant dashboard for owners, the customer dashboard for everyone else. */
export function Dashboard() {
  const { restaurant } = useProfile();
  return restaurant ? <OwnerDashboard restaurant={restaurant} /> : <CustomerDashboard />;
}
