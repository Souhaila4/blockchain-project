"use client";

import { useState, type FormEvent } from "react";
import { AcceptanceMode } from "@/lib/acceptance";
import { registerRestaurant } from "@/lib/contracts";
import { describeTransactionError } from "@/lib/errors";
import { validateRestaurant } from "@/lib/validation";
import { AcceptanceFields } from "./AcceptanceFields";
import { useProfile } from "./ProfileProvider";
import { Card, Field, FormMessage, SubmitButton } from "./ui";
import { useAction } from "./useAction";

/**
 * Registers the connected wallet as a restaurant. When the transaction is confirmed the profile
 * reloads, the wallet becomes an owner, and the page sends it to its dashboard.
 */
export function CreateRestaurantForm() {
  const { restaurants, reload } = useProfile();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [symbol, setSymbol] = useState("");
  const [mode, setMode] = useState<AcceptanceMode>(AcceptanceMode.OwnTokenOnly);
  const [partners, setPartners] = useState<string[]>([]);
  const { pending, error, success, run, fail } = useAction(describeTransactionError);

  function togglePartner(address: string, checked: boolean) {
    setPartners((current) =>
      checked ? [...current, address] : current.filter((partner) => partner !== address),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateRestaurant({ name, location, symbol });
    if (validation) {
      fail(validation);
      return;
    }

    const created = await run(
      () =>
        registerRestaurant({
          name,
          location,
          symbol,
          mode,
          partners: mode === AcceptanceMode.SelectedPartners ? partners : [],
        }),
      "Restaurant created. Opening your dashboard…",
    );
    if (created) reload();
  }

  return (
    <Card className="max-w-2xl">
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-white/70">
          Your connected wallet becomes the restaurant and gets its own token. Name, location and
          symbol cannot be changed later. The tokens you accept can.
        </p>

        <Field
          label="Name"
          value={name}
          placeholder="Cafe Luna"
          disabled={pending}
          onChange={setName}
        />
        <Field
          label="Location"
          value={location}
          placeholder="12 Market Street"
          disabled={pending}
          onChange={setLocation}
        />
        <Field
          label="Token symbol"
          value={symbol}
          placeholder="LUNA"
          autoComplete="off"
          spellCheck={false}
          disabled={pending}
          onChange={(value) => setSymbol(value.toUpperCase())}
        />

        <AcceptanceFields
          mode={mode}
          onModeChange={setMode}
          candidates={restaurants}
          candidatesError={null}
          selected={partners}
          onToggle={togglePartner}
          disabled={pending}
        />

        <FormMessage error={error} success={success} />

        <div className="flex justify-end pt-2">
          <SubmitButton pending={pending} label="Create restaurant" pendingLabel="Creating…" />
        </div>
      </form>
    </Card>
  );
}
