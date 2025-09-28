import { getServerSession } from "next-auth";

import { UnauthorizedError } from "@/lib/domain/errors";
import { authOptions } from "./options";

export async function requireApiSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new UnauthorizedError();
  }

  return session;
}

export async function requireApiRole(allowedRoles: string[]) {
  const session = await requireApiSession();
  const roles = session.user?.roles ?? [];

  if (!allowedRoles.some((role) => roles.includes(role))) {
    throw new UnauthorizedError("You are not permitted to perform this action");
  }

  return session;
}
