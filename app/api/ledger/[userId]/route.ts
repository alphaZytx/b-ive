import { NextRequest } from "next/server";

import { jsonResponse, handleApiError } from "@/lib/api/responses";
import { requireApiSession } from "@/lib/auth/api";
import { UnauthorizedError } from "@/lib/domain/errors";
import { getLedgerSummary } from "@/lib/domain/services";

type RouteContext = {
  params: { userId: string };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireApiSession();
    const userId = context.params.userId;
    const roles = session.user?.roles ?? [];

    if (session.user?.id !== userId && !roles.some((role) => ["admin", "government"].includes(role))) {
      throw new UnauthorizedError("You are not allowed to view this ledger");
    }

    const result = await getLedgerSummary(context.params.userId);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
