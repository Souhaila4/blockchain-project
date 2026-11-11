"use client";

import { useEffect, useRef, useState } from "react";
import { shortAddress } from "@/lib/format";
import { ChevronDownIcon, CopyIcon, LogoutIcon, WalletIcon } from "./icons";
import { useProfile } from "./ProfileProvider";
import { useWallet } from "./WalletProvider";

/** The connected address with a small menu to copy it or disconnect. */
export function WalletChip() {
  const { account } = useProfile();
  const { disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied. Nothing else to do.
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white hover:bg-white/[0.08]"
      >
        <WalletIcon className="h-4 w-4 text-white/70" />
        {shortAddress(account)}
        <ChevronDownIcon className="h-4 w-4 text-white/60" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#15110f] p-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => void copy()}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-white/85 hover:bg-white/5"
          >
            <CopyIcon className="h-4 w-4" />
            {copied ? "Copied" : "Copy address"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void disconnect()}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-white/85 hover:bg-white/5"
          >
            <LogoutIcon className="h-4 w-4" />
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}
