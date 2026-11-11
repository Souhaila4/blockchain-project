"use client";

import { useState, type FormEvent } from "react";
import { MAX_REWARDS } from "@/lib/config";
import { describeTransactionError } from "@/lib/errors";
import { formatPoints } from "@/lib/format";
import { addReward, updateReward, UNLIMITED_STOCK, type RewardOffer } from "@/lib/market";
import { parsePointsAmount, parseReward, parseStock } from "@/lib/validation";
import { ActionButton, Field, FormMessage, SubmitButton } from "./ui";
import { useAction } from "./useAction";

/** What a customer can get for points, for example a free coffee, and how many points it takes. */
export function RewardEditor({
  rewards,
  symbol,
  onChanged,
}: {
  rewards: RewardOffer[];
  symbol: string;
  onChanged: () => void;
}) {
  return (
    <div className="space-y-5">
      {rewards.length === 0 ? (
        <p className="text-sm text-white/60">You have no rewards yet. Add the first one below.</p>
      ) : (
        <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.07]">
          {rewards.map((reward) => (
            <RewardRow key={reward.id} reward={reward} symbol={symbol} onChanged={onChanged} />
          ))}
        </ul>
      )}

      <AddRewardForm full={rewards.length >= MAX_REWARDS} onAdded={onChanged} />
    </div>
  );
}

function RewardRow({
  reward,
  symbol,
  onChanged,
}: {
  reward: RewardOffer;
  symbol: string;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [cost, setCost] = useState(reward.cost.toString());
  const [stock, setStock] = useState(stockText(reward.stock));
  const { pending, error, run, fail } = useAction(describeTransactionError);

  function startEditing() {
    setCost(reward.cost.toString());
    setStock(stockText(reward.stock));
    setEditing(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const parsed = parsePointsAmount(cost, false);
    if (parsed.error !== null) return fail(parsed.error);

    const parsedStock = parseStock(stock);
    if (parsedStock.error !== null) return fail(parsedStock.error);

    const saved = await run(() =>
      updateReward({
        id: reward.id,
        cost: parsed.value,
        stock: parsedStock.value,
        isActive: reward.isActive,
      }),
    );
    if (saved) {
      setEditing(false);
      onChanged();
    }
  }

  async function toggle() {
    if (await run(() => updateReward({ ...reward, isActive: !reward.isActive }))) onChanged();
  }

  return (
    <li className="space-y-3 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-sm ${reward.isActive ? "text-white" : "text-white/45"}`}>
            {reward.name}
            {reward.isActive ? null : (
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                Hidden
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-white/55">
            {formatPoints(reward.cost)} {symbol} ·{" "}
            {reward.stock === UNLIMITED_STOCK ? "unlimited stock" : `${reward.stock} left`}
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
            {reward.isActive ? "Hide" : "Show"}
          </ActionButton>
        </div>
      </div>

      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <Field
            label="Points needed"
            value={cost}
            placeholder="50"
            inputMode="numeric"
            disabled={pending}
            onChange={setCost}
          />
          <Field
            label="Stock (empty = unlimited)"
            value={stock}
            placeholder="Unlimited"
            inputMode="numeric"
            disabled={pending}
            onChange={setStock}
          />
          <SubmitButton pending={pending} label="Save changes" pendingLabel="Confirm in MetaMask…" />
        </form>
      ) : null}

      <FormMessage error={error} />
    </li>
  );
}

function AddRewardForm({ full, onAdded }: { full: boolean; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const { pending, error, success, run, fail } = useAction(describeTransactionError);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseReward({ name, cost, stock });
    if (parsed.error !== null) return fail(parsed.error);

    const added = await run(() => addReward(parsed.value), `${parsed.value.name} added to your rewards.`);
    if (added) {
      setName("");
      setCost("");
      setStock("");
      onAdded();
    }
  }

  if (full) {
    return (
      <p className="text-sm text-white/60">
        You have reached {MAX_REWARDS} rewards. Hide the ones you no longer offer to make room.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-white/[0.07] pt-5" noValidate>
      <h3 className="text-sm font-medium text-white">Add a reward</h3>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Field label="Name" value={name} placeholder="Free coffee" disabled={pending} onChange={setName} />
        <Field
          label="Points needed"
          value={cost}
          placeholder="50"
          inputMode="numeric"
          disabled={pending}
          onChange={setCost}
        />
        <Field
          label="Stock"
          value={stock}
          placeholder="Unlimited"
          inputMode="numeric"
          disabled={pending}
          onChange={setStock}
        />
      </div>
      <FormMessage error={error} success={success} />
      <SubmitButton pending={pending} label="Add reward" pendingLabel="Confirm in MetaMask…" />
    </form>
  );
}

function stockText(stock: bigint) {
  return stock === UNLIMITED_STOCK ? "" : stock.toString();
}
