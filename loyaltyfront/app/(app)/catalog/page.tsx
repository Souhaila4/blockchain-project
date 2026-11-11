import type { Metadata } from "next";
import { CatalogManager } from "@/components/CatalogManager";

export const metadata: Metadata = { title: "Menu & Rewards · LoyalChain" };

export default function CatalogPage() {
  return <CatalogManager />;
}
