import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

/** Every page in this group needs a connected wallet and shares the sidebar and header. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
