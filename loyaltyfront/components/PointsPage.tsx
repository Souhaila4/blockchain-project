"use client";

import { PageHeading } from "./ui";
import { TokensPanel } from "./TokensPanel";

/** The points this wallet earned by buying, and what it has spent. Same page for owners and customers. */
export function PointsPage() {
  return (
    <div className="space-y-5">
      <PageHeading
        title="Points & rewards"
        description="Points you earned by buying from restaurants. Open a restaurant to spend them on its rewards."
      />
      <TokensPanel />
    </div>
  );
}
