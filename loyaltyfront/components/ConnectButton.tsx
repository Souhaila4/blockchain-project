"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { script } from "@/lib/fonts";
import { menuItemClass } from "./ui";
import { useWallet } from "./WalletProvider";

/** The only action on the home page. Once a wallet is connected, the visitor goes to the main menu. */
export function ConnectButton() {
  const { account, ready, connecting, error, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (account) router.replace("/menu");
  }, [account, router]);

  if (account) {
    return <p className="text-sm text-white/70">Opening your dashboard…</p>;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => void connect()}
        disabled={!ready || connecting}
        aria-busy={connecting}
        className={`${script.className} ${menuItemClass}`}
      >
        {connecting ? "Connecting…" : "Connect to MetaMask"}
      </button>
      {error ? <p className="max-w-xs text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
