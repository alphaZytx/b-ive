import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireSession(redirectTo: string) {
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(redirectTo)}`);
  }

  return session;
}

export async function requireRole(allowedRoles: string[], redirectTo: string) {
  const session = await requireSession(redirectTo);
  const userRoles = session.user?.roles ?? [];

  if (!allowedRoles.some((role) => userRoles.includes(role))) {
    redirect("/workspace");
  }

  return session;
}
