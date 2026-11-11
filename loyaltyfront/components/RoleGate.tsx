"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useProfile, type Role } from "./ProfileProvider";

/** Shows its children to one role only. Anyone else is sent to `redirectTo`. */
export function RoleGate({
  role,
  redirectTo,
  children,
}: {
  role: Role;
  redirectTo: string;
  children: ReactNode;
}) {
  const profile = useProfile();
  const router = useRouter();
  const allowed = profile.role === role;

  useEffect(() => {
    if (!allowed) router.replace(redirectTo);
  }, [allowed, redirectTo, router]);

  return allowed ? <>{children}</> : null;
}
