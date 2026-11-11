"use client";

import { useCallback, useMemo } from "react";
import type { AcceptanceMode } from "@/lib/acceptance";
import {
  getPartners,
  setAcceptanceMode,
  setPartner,
  setRestaurantActive,
  type Restaurant,
} from "@/lib/contracts";
import { describeTransactionError } from "@/lib/errors";
import { shortAddress } from "@/lib/format";
import { AcceptanceFields } from "./AcceptanceFields";
import { useProfile } from "./ProfileProvider";
import { ActionButton, Card, FormMessage } from "./ui";
import { useAction } from "./useAction";
import { useLoad } from "./useLoad";

/** Everything an owner can see and change about their restaurant. */
export function RestaurantSettings({ restaurant }: { restaurant: Restaurant }) {
  const { reload } = useProfile();

  return (
    <div className="grid max-w-2xl gap-6">
      <Card title="Details">
        <dl className="space-y-3 text-sm">
          <Detail label="Name" value={restaurant.name} />
          <Detail label="Location" value={restaurant.location} />
          <Detail label="Wallet" value={shortAddress(restaurant.address)} mono />
          <Detail label="Token" value={`${restaurant.symbol} · ${shortAddress(restaurant.token)}`} />
        </dl>
      </Card>

      <Card title="Accepted tokens">
        <AcceptanceControl restaurant={restaurant} onChanged={reload} />
      </Card>

      <Card title="Status">
        <StatusControl restaurant={restaurant} onChanged={reload} />
      </Card>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-white/55">{label}</dt>
      <dd className={`text-right text-white ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

/** Every change here is its own transaction, so it takes effect only after MetaMask confirms. */
function AcceptanceControl({
  restaurant,
  onChanged,
}: {
  restaurant: Restaurant;
  onChanged: () => void;
}) {
  const { restaurants } = useProfile();
  const others = useMemo(
    () => restaurants.filter((other) => other.address !== restaurant.address),
    [restaurants, restaurant.address],
  );

  const loadPartners = useCallback(
    () => getPartners(restaurant.address, others),
    [restaurant.address, others],
  );
  const { data: partners, error: loadError, reload } = useLoad(loadPartners);
  const { pending, error, run } = useAction(describeTransactionError);

  async function changeMode(mode: AcceptanceMode) {
    if (mode === restaurant.mode) return;
    if (await run(() => setAcceptanceMode(mode))) onChanged();
  }

  async function togglePartner(address: string, accepted: boolean) {
    if (await run(() => setPartner(address, accepted))) reload();
  }

  return (
    <div className="space-y-2">
      <AcceptanceFields
        mode={restaurant.mode}
        onModeChange={(mode) => void changeMode(mode)}
        candidates={others}
        candidatesError={loadError}
        selected={partners ?? []}
        onToggle={(address, accepted) => void togglePartner(address, accepted)}
        disabled={pending}
      />
      <p className="text-xs text-white/55">
        {pending
          ? "Confirm the change in MetaMask…"
          : "Each change is one transaction that MetaMask asks you to confirm."}
      </p>
      <FormMessage error={error} />
    </div>
  );
}

function StatusControl({
  restaurant,
  onChanged,
}: {
  restaurant: Restaurant;
  onChanged: () => void;
}) {
  const { pending, error, run } = useAction(describeTransactionError);

  async function toggle() {
    if (await run(() => setRestaurantActive(!restaurant.isActive))) onChanged();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/80">
        {restaurant.isActive
          ? "This restaurant is open: customers can buy from its menu and claim its rewards."
          : "This restaurant is paused: customers cannot buy from it or claim its rewards."}
      </p>

      <FormMessage error={error} />

      <ActionButton tone="ghost" onClick={() => void toggle()} disabled={pending}>
        {pending ? "Updating…" : restaurant.isActive ? "Pause restaurant" : "Resume restaurant"}
      </ActionButton>
    </div>
  );
}
