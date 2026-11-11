"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { Mascot } from "./Mascot";
import { ProfileProvider } from "./ProfileProvider";
import { MobileNav, Sidebar } from "./Sidebar";
import { useWallet } from "./WalletProvider";

/**
 * Frame for every signed-in page: sidebar, header and a content panel.
 * Without a connected wallet it sends the visitor back to the home page.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { account, ready } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (ready && !account) router.replace("/");
  }, [ready, account, router]);

  if (!account) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-sm text-white/60">
        <Mascot mood="sleepy" className="h-24 w-24" />
        {ready ? "Redirecting…" : "Loading…"}
      </div>
    );
  }

  return (
    <ProfileProvider key={account} account={account}>
      <div className="flex min-h-dvh bg-[radial-gradient(circle_at_0%_100%,rgba(240,115,64,0.12),transparent_40%)] bg-[#0a0807] text-white">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />

          <main className="flex-1 p-3 sm:p-4 lg:py-4 lg:pr-4 lg:pl-0">
            <div className="min-h-full space-y-6 rounded-2xl border border-white/[0.06] bg-[#100c0b] p-4 sm:p-6">
              <Header />
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProfileProvider>
  );
}
