"use client";

import { useState, type FormEvent } from "react";
import { formatEther } from "ethers";
import { MAX_ITEMS } from "@/lib/config";
import { describeTransactionError } from "@/lib/errors";
import { formatMoney, plusPoints } from "@/lib/format";
import { addMenuItem, updateMenuItem, type MenuItem } from "@/lib/market";
import { parseItem, parsePointsAmount, parsePrice } from "@/lib/validation";
import { ActionButton, Field, FormMessage, SubmitButton } from "./ui";
import { useAction } from "./useAction";

/** The items a restaurant sells: what each costs and how many points a customer earns for it. */
export function MenuEditor({ items, onChanged }: { items: MenuItem[]; onChanged: () => void }) {
  return (
    <div className="space-y-5">
      {items.length === 0 ? (
        <p className="text-sm text-white/60">Your menu is empty. Add the first item below.</p>
      ) : (
        <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.07]">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onChanged={onChanged} />
          ))}
        </ul>
      )}

      <AddItemForm full={items.length >= MAX_ITEMS} onAdded={onChanged} />
    </div>
  );
}

function ItemRow({ item, onChanged }: { item: MenuItem; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(formatEther(item.price));
  const [points, setPoints] = useState(item.points.toString());
  const { pending, error, run, fail } = useAction(describeTransactionError);

  function startEditing() {
    setPrice(formatEther(item.price));
    setPoints(item.points.toString());
    setEditing(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const parsedPrice = parsePrice(price);
    if (parsedPrice.error !== null) return fail(parsedPrice.error);
    const parsedPoints = parsePointsAmount(points, true);
    if (parsedPoints.error !== null) return fail(parsedPoints.error);

    const saved = await run(() =>
      updateMenuItem({
        id: item.id,
        price: parsedPrice.value,
        points: parsedPoints.value,
        isActive: item.isActive,
      }),
    );
    if (saved) {
      setEditing(false);
      onChanged();
    }
  }

  async function toggle() {
    if (await run(() => updateMenuItem({ ...item, isActive: !item.isActive }))) onChanged();
  }

  return (
    <li className="space-y-3 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-sm ${item.isActive ? "text-white" : "text-white/45"}`}>
            {item.name}
            {item.isActive ? null : (
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                Hidden
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-white/55">
            {formatMoney(item.price)} · {plusPoints(Number(item.points))}
          </p>
        </div>

        <div className="flex items-center">
          <ActionButton
            tone="ghost"
            onClick={() => (editing ? setEditing(false) : startEditing())}
            disabled={pending}
          >
            {editing ? "Cancel" : "Edit"}
          </ActionButton>
          <ActionButton tone="ghost" onClick={() => void toggle()} disabled={pending || editing}>
            {item.isActive ? "Hide" : "Show"}
          </ActionButton>
        </div>
      </div>

      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Price"
              value={price}
              placeholder="0.01"
              inputMode="text"
              disabled={pending}
              onChange={setPrice}
            />
            <Field
              label="Points earned"
              value={points}
              placeholder="10"
              inputMode="numeric"
              disabled={pending}
              onChange={setPoints}
            />
          </div>
          <SubmitButton pending={pending} label="Save changes" pendingLabel="Confirm in MetaMask…" />
        </form>
      ) : null}

      <FormMessage error={error} />
    </li>
  );
}

function AddItemForm({ full, onAdded }: { full: boolean; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [points, setPoints] = useState("");
  const { pending, error, success, run, fail } = useAction(describeTransactionError);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseItem({ name, price, points });
    if (parsed.error !== null) return fail(parsed.error);

    const added = await run(() => addMenuItem(parsed.value), `${parsed.value.name} added to your menu.`);
    if (added) {
      setName("");
      setPrice("");
      setPoints("");
      onAdded();
    }
  }

  if (full) {
    return (
      <p className="text-sm text-white/60">
        Your menu has reached {MAX_ITEMS} items. Hide the ones you no longer sell to make room.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-white/[0.07] pt-5" noValidate>
      <h3 className="text-sm font-medium text-white">Add an item</h3>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Field label="Name" value={name} placeholder="Latte" disabled={pending} onChange={setName} />
        <Field
          label="Price"
          value={price}
          placeholder="0.01"
          disabled={pending}
          onChange={setPrice}
        />
        <Field
          label="Points earned"
          value={points}
          placeholder="10"
          inputMode="numeric"
          disabled={pending}
          onChange={setPoints}
        />
      </div>
      <FormMessage error={error} success={success} />
      <SubmitButton pending={pending} label="Add to menu" pendingLabel="Confirm in MetaMask…" />
    </form>
  );
}
