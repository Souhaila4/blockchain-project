"use client";

import { useId } from "react";
import { ACCEPTANCE_OPTIONS, AcceptanceMode } from "@/lib/acceptance";
import type { Restaurant } from "@/lib/contracts";

type AcceptanceFieldsProps = {
  mode: AcceptanceMode;
  onModeChange: (mode: AcceptanceMode) => void;
  /** Restaurants that can be picked as partners. `null` while they load. Never includes the restaurant itself. */
  candidates: Restaurant[] | null;
  candidatesError: string | null;
  /** Addresses of the picked partners. */
  selected: string[];
  onToggle: (address: string, checked: boolean) => void;
  disabled: boolean;
};

/** Which tokens a restaurant accepts. Shared by the create form and the restaurant settings. */
export function AcceptanceFields({
  mode,
  onModeChange,
  candidates,
  candidatesError,
  selected,
  onToggle,
  disabled,
}: AcceptanceFieldsProps) {
  const groupName = useId();

  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="mb-2 text-sm text-white/80">Which tokens do you accept as payment?</legend>

      {ACCEPTANCE_OPTIONS.map((option) => (
        <label
          key={option.mode}
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left has-[:checked]:border-[#F07340] has-[:disabled]:cursor-wait has-[:disabled]:opacity-60"
        >
          <input
            type="radio"
            name={groupName}
            checked={mode === option.mode}
            onChange={() => onModeChange(option.mode)}
            className="mt-1 accent-[#F07340]"
          />
          <span>
            <span className="block text-sm text-white">{option.label}</span>
            <span className="block text-xs text-white/60">{option.hint}</span>
          </span>
        </label>
      ))}

      {mode === AcceptanceMode.SelectedPartners ? (
        <Partners
          candidates={candidates}
          error={candidatesError}
          selected={selected}
          onToggle={onToggle}
        />
      ) : null}
    </fieldset>
  );
}

function Partners({
  candidates,
  error,
  selected,
  onToggle,
}: {
  candidates: Restaurant[] | null;
  error: string | null;
  selected: string[];
  onToggle: (address: string, checked: boolean) => void;
}) {
  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (candidates === null) return <p className="text-sm text-white/70">Loading restaurants…</p>;
  if (candidates.length === 0) {
    return (
      <p className="text-sm text-white/70">
        No other restaurant exists yet. You can add partners here later.
      </p>
    );
  }

  return (
    <ul className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-white/10 p-2">
      {candidates.map((candidate) => (
        <li key={candidate.address}>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm text-white hover:bg-white/5 has-[:disabled]:cursor-wait">
            <input
              type="checkbox"
              checked={selected.includes(candidate.address)}
              onChange={(event) => onToggle(candidate.address, event.target.checked)}
              className="accent-[#F07340]"
            />
            <span>
              {candidate.name}
              <span className="ml-2 text-xs text-white/55">{candidate.symbol}</span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
