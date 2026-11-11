import type { Metadata } from "next";
import { TransactionsView } from "@/components/TransactionsView";
import { PageHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Transactions · LoyalChain" };

export default function TransactionsPage() {
  return (
    <div className="space-y-5">
      <PageHeading
        title="Transactions"
        description="Purchases and reward claims, read from the blockchain."
      />
      <TransactionsView />
    </div>
  );
}
