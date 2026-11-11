"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { script } from "@/lib/fonts";
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
        className={`${script.className} cursor-pointer rounded-full border border-[#F07340]/50 bg-[#F07340]/15 px-9 py-3 text-[1.7rem] leading-none text-white shadow-[0_10px_30px_-8px_rgba(240,115,64,0.6)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-[#F07340]/30 hover:shadow-[0_14px_36px_-8px_rgba(240,115,64,0.85)] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none`}
      >
        {connecting ? "Connecting…" : "Connect to MetaMask"}
      </button>
      {error ? <p className="max-w-xs text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
