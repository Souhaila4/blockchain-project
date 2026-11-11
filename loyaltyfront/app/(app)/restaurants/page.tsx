import type { Metadata } from "next";
import { RestaurantDirectory } from "@/components/RestaurantDirectory";
import { PageHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Restaurants · LoyalChain" };

export default function RestaurantsPage() {
  return (
    <div className="space-y-5">
      <PageHeading
        title="Restaurants"
        description="Every restaurant on LoyalChain, with its token and the tokens it accepts."
      />
      <RestaurantDirectory />
    </div>
  );
}
