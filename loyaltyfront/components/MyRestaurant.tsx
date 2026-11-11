"use client";

import { PageHeading } from "./ui";
import { useProfile } from "./ProfileProvider";
import { RestaurantSettings } from "./RestaurantSettings";
import { RoleGate } from "./RoleGate";

export function MyRestaurant() {
  const { restaurant } = useProfile();

  return (
    <RoleGate role="owner" redirectTo="/create">
      {restaurant ? (
        <div className="space-y-5">
          <PageHeading
            title="My restaurant"
            description="Your restaurant on the blockchain, the tokens it accepts, and whether it is open."
          />
          <RestaurantSettings restaurant={restaurant} />
        </div>
      ) : null}
    </RoleGate>
  );
}
