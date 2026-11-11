"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "./icons";
import { Mascot, type MascotMood } from "./Mascot";

export const menuItemClass =
  "cursor-pointer border-0 bg-transparent p-0 text-[1.85rem] leading-[1.25] tracking-wide text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] transition-colors duration-300 ease-out hover:text-[#F07340] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F07340] disabled:cursor-wait motion-reduce:transition-none sm:text-[2rem]";

const primaryButtonClass =
  "cursor-pointer rounded-full border-0 bg-gradient-to-b from-[#FF8A57] to-[#F07340] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_6px_18px_-6px_rgba(240,115,64,0.7)] transition duration-200 hover:-translate-y-px hover:shadow-[0_10px_22px_-6px_rgba(240,115,64,0.85)] active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none motion-reduce:transition-none";

const ghostButtonClass =
  "cursor-pointer rounded-full border-0 bg-transparent px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

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
        className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 hover:border-white/25 focus:border-[#F07340] focus:bg-white/[0.07] focus:ring-2 focus:ring-[#F07340]/25 disabled:opacity-60"
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
        className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0d0a09] px-3 py-2.5 text-sm text-white outline-none transition hover:border-white/25 focus:border-[#F07340] focus:ring-2 focus:ring-[#F07340]/25 disabled:opacity-60"
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
      className={`fade-up rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.02] p-5 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_12px_32px_-18px_rgba(0,0,0,0.8)] transition-colors hover:border-white/[0.12] motion-reduce:transition-none ${className}`}
    >
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white"><span className="h-3.5 w-1 rounded-full bg-[#F07340]" aria-hidden="true" />{title}</h2>
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
    <div className="fade-up">
      <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
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

/** Loading and error states used by every data-driven panel. Lio naps while data loads. */
export function LoadState({ loading, error }: { loading: boolean; error: string | null }) {
  if (error) {
    return (
      <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-500/[0.07] p-3">
        <Mascot mood="think" animated={false} className="h-12 w-12 shrink-0" />
        <p className="text-sm text-red-200">{error}</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-3 py-2">
        <Mascot mood="sleepy" className="h-12 w-12 shrink-0" />
        <div className="w-full max-w-xs space-y-2">
          <div className="skeleton h-3 w-2/3 rounded-full" />
          <div className="skeleton h-3 w-1/2 rounded-full" />
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    );
  }
  return null;
}

/** A friendly empty state: Lio with a short message and an optional next step. */
export function EmptyState({
  mood = "happy",
  children,
  action,
}: {
  mood?: MascotMood;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 px-4 py-6 text-center">
      <Mascot mood={mood} className="h-20 w-20" />
      <div className="max-w-sm text-sm text-white/65">{children}</div>
      {action}
    </div>
  );
}

export function FormMessage({ error, success }: { error?: string | null; success?: string | null }) {
  if (error) return <p role="alert" className="text-sm text-red-300">{error}</p>;
  if (success) return <p role="status" className="text-sm text-[#FFB07A]">✓ {success}</p>;
  return null;
}
