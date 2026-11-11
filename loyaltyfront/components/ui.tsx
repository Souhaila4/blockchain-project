"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "./icons";

export const menuItemClass =
  "cursor-pointer border-0 bg-transparent p-0 text-[1.85rem] leading-[1.25] tracking-wide text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] transition-colors duration-300 ease-out hover:text-[#F07340] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F07340] disabled:cursor-wait motion-reduce:transition-none sm:text-[2rem]";

const primaryButtonClass =
  "cursor-pointer rounded-full border-0 bg-[#F07340] px-5 py-2.5 text-sm font-medium text-black disabled:cursor-wait disabled:opacity-70";

const ghostButtonClass =
  "cursor-pointer border-0 bg-transparent px-3 py-2 text-sm text-white/75 hover:text-white disabled:cursor-wait disabled:opacity-60";

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  disabled: boolean;
  autoComplete?: string;
  spellCheck?: boolean;
  inputMode?: "numeric" | "text";
};

export function Field({
  label,
  value,
  placeholder,
  onChange,
  disabled,
  autoComplete,
  spellCheck,
  inputMode,
}: FieldProps) {
  return (
    <label className="block text-left text-sm text-white/80">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#F07340] disabled:opacity-60"
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block text-left text-sm text-white/80">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/15 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#F07340] disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  );
}

export function SubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button type="submit" disabled={pending} className={primaryButtonClass}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function ActionButton({
  onClick,
  disabled,
  tone = "primary",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "ghost";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={tone === "primary" ? primaryButtonClass : ghostButtonClass}
    >
      {children}
    </button>
  );
}

/** A dashboard panel with an optional title row. */
export function Card({
  title,
  action,
  className = "",
  children,
}: {
  title?: string;
  /** Shown at the right of the title, for example a "View all" link. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ${className}`}
    >
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-white">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Title and one-line explanation at the top of a page. */
export function PageHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-lg font-medium text-white">{title}</h2>
      {description ? <p className="mt-1 max-w-xl text-sm text-white/60">{description}</p> : null}
    </div>
  );
}

/** Small orange link with an arrow, for the top-right corner of a card. */
export function ViewAllLink({ href, children = "View all" }: { href: string; children?: ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 text-xs text-white/70 hover:text-[#F07340]">
      {children}
      <ArrowRightIcon className="h-3.5 w-3.5 text-[#F07340]" />
    </Link>
  );
}

/** Loading and error lines used by every data-driven panel. */
export function LoadState({ loading, error }: { loading: boolean; error: string | null }) {
  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (loading) return <p className="text-sm text-white/60">Loading…</p>;
  return null;
}

export function FormMessage({ error, success }: { error?: string | null; success?: string | null }) {
  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (success) return <p className="text-sm text-[#F07340]">{success}</p>;
  return null;
}
