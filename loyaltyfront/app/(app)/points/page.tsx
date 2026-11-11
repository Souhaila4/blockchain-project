import type { Metadata } from "next";
import { PointsPage } from "@/components/PointsPage";

export const metadata: Metadata = { title: "Points & Rewards · LoyalChain" };

export default function PointsRoute() {
  return <PointsPage />;
}
