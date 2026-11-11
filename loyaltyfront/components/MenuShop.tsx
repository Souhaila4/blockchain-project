"use client";

import { useState } from "react";
import type { Restaurant } from "@/lib/contracts";
import { describeTransactionError } from "@/lib/errors";
import { formatMoney, formatPoints, plusPoints } from "@/lib/format";
import { purchaseItem, type MenuItem } from "@/lib/market";
import { ActionButton, EmptyState, FormMessage } from "./ui";
import { useAction } from "./useAction";

const MAX_QUANTITY = 10;
const QUANTITIES = Array.from({ length: MAX_QUANTITY }, (_, index) => index + 1);

/** What a customer can buy. Paying sends the money to the restaurant and mints the points to the buyer. */
export function MenuShop({
  restaurant,
  items,
  canBuy,
  onPurchased,
}: {
  restaurant: Restaurant;
  items: MenuItem[];
  canBuy: boolean;
  onPurchased: () => void;
}) {
  const available = items.filter((item) => item.isActive);

  if (available.length === 0) {
    return <EmptyState mood="sleepy">This restaurant has not put anything on its menu yet.</EmptyState>;
  }

  return (
    <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.07]">
      {available.map((item) => (
        <ShopItem
          key={item.id}
          restaurant={restaurant}
          item={item}
          canBuy={canBuy}
          onPurchased={onPurchased}
        />
      ))}
    </ul>
  );
}

function ShopItem({
  restaurant,
  item,
  canBuy,
  onPurchased,
}: {
  restaurant: Restaurant;
  item: MenuItem;
  canBuy: boolean;
  onPurchased: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const { pending, error, success, run } = useAction(describeTransactionError);

  const total = item.price * BigInt(quantity);
  const earned = item.points * BigInt(quantity);

  async function buy() {
    const bought = await run(
      () => purchaseItem({ restaurant: restaurant.address, item, quantity }),
      earned > BigInt(0)
        ? `Bought ${quantity} × ${item.name}. You earned ${formatPoints(earned)} ${restaurant.symbol}.`
        : `Bought ${quantity} × ${item.name}.`,
    );
    if (bought) {
      setQuantity(1);
      onPurchased();
    }
  }

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-white">{item.name}</p>
          <p className="mt-0.5 text-xs text-white/55">
            {formatMoney(item.price)}
            {item.points > BigInt(0) ? (
              <span className="text-emerald-400">
                {" · "}
                {plusPoints(Number(item.points))} {restaurant.symbol}
              </span>
            ) : null}
          </p>
        </div>

        {canBuy ? (
          <div className="flex items-center gap-2">
            <select
              aria-label={`Quantity of ${item.name}`}
              value={quantity}
              disabled={pending}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="rounded-xl border border-white/15 bg-black px-2.5 py-2 text-sm text-white outline-none focus:border-[#F07340] disabled:opacity-60"
            >
              {QUANTITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <ActionButton onClick={() => void buy()} disabled={pending}>
              {pending ? "Confirm in MetaMask…" : `Buy · ${formatMoney(total)}`}
            </ActionButton>
          </div>
        ) : null}
      </div>

      <FormMessage error={error} success={success} />
    </li>
  );
}
