import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAddress, isAddress } from "ethers";
import { RestaurantDetail } from "@/components/RestaurantDetail";

export const metadata: Metadata = { title: "Restaurant · LoyalChain" };

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  if (!isAddress(address)) notFound();

  return <RestaurantDetail address={getAddress(address)} />;
}
