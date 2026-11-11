import type { Metadata } from "next";
import { MyRestaurant } from "@/components/MyRestaurant";

export const metadata: Metadata = { title: "My Restaurant · LoyalChain" };

export default function RestaurantPage() {
  return <MyRestaurant />;
}
