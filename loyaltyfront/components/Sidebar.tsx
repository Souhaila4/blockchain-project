"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { script } from "@/lib/fonts";
import {
  ChainMark,
  GiftIcon,
  HistoryIcon,
  HomeIcon,
  MenuBookIcon,
  PlusIcon,
  StoreIcon,
  UsersIcon,
} from "./icons";
import { IdentityCard } from "./Identity";
import { useProfile, type Role } from "./ProfileProvider";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const HOME: NavItem = { href: "/menu", label: "Home", icon: HomeIcon };
const RESTAURANTS: NavItem = { href: "/restaurants", label: "Restaurants", icon: UsersIcon };
const POINTS: NavItem = { href: "/points", label: "Points & Rewards", icon: GiftIcon };
const TRANSACTIONS: NavItem = { href: "/transactions", label: "Transactions", icon: HistoryIcon };

/** What each role can reach. Owners run their restaurant. Customers can start one. */
const NAVIGATION: Record<Role, NavItem[]> = {
  owner: [
    HOME,
    { href: "/restaurant", label: "My Restaurant", icon: StoreIcon },
    { href: "/catalog", label: "Menu & Rewards", icon: MenuBookIcon },
    RESTAURANTS,
    POINTS,
    TRANSACTIONS,
  ],
  customer: [
    HOME,
    { href: "/create", label: "Create Restaurant", icon: PlusIcon },
    RESTAURANTS,
    POINTS,
    TRANSACTIONS,
  ],
};

function useNavigation() {
  const { role } = useProfile();
  return NAVIGATION[role];
}

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <Link href="/menu" className="flex items-center gap-2.5 rounded-md">
      <ChainMark className="h-8 w-10" />
      <span className={`${script.className} text-[1.7rem] leading-none text-white`}>LoyalChain</span>
    </Link>
  );
}

/** Left navigation on large screens. */
export function Sidebar() {
  const items = useNavigation();
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col px-4 py-6 lg:flex">
      <div className="px-2">
        <Brand />
      </div>

      <nav aria-label="Main" className="mt-10 flex-1">
        <ul className="space-y-1">
          {items.map(({ href, label, icon: ItemIcon }) => {
            const current = isCurrent(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors motion-reduce:transition-none ${
                    current
                      ? "border-[#F07340]/30 bg-gradient-to-r from-[#F07340]/25 to-[#F07340]/5 text-white"
                      : "border-transparent text-white/65 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <ItemIcon className={`h-[18px] w-[18px] ${current ? "text-[#F07340]" : ""}`} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <IdentityCard />
    </aside>
  );
}

/** The same links as a scrollable row for small screens, where the sidebar is hidden. */
export function MobileNav() {
  const items = useNavigation();
  const pathname = usePathname();

  return (
    <div className="border-b border-white/[0.07] px-4 pt-4 pb-3 lg:hidden">
      <Brand />
      <nav aria-label="Main" className="-mx-1 mt-3 overflow-x-auto px-1">
        <ul className="flex gap-2">
          {items.map(({ href, label, icon: ItemIcon }) => {
            const current = isCurrent(pathname, href);
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs ${
                    current
                      ? "border-[#F07340]/40 bg-[#F07340]/15 text-white"
                      : "border-white/10 text-white/65"
                  }`}
                >
                  <ItemIcon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
