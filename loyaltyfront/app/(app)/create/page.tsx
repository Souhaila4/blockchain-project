import type { Metadata } from "next";
import { CreateRestaurantForm } from "@/components/CreateRestaurantForm";
import { RoleGate } from "@/components/RoleGate";
import { PageHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Create Restaurant · LoyalChain" };

export default function CreateRestaurantPage() {
  // A wallet can register one restaurant. Once it has one, this page has nothing left to offer.
  return (
    <RoleGate role="customer" redirectTo="/menu">
      <div className="space-y-5">
        <PageHeading
          title="Create restaurant"
          description="Register your restaurant on the blockchain and get a token for your loyalty points."
        />
        <CreateRestaurantForm />
      </div>
    </RoleGate>
  );
}
