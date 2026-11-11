import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";

export const metadata: Metadata = { title: "Home · LoyalChain" };

export default function MenuPage() {
  return <Dashboard />;
}
