import { NextRequest } from "next/server";

import { jsonResponse, handleApiError } from "@/lib/api/responses";
import { getLedgerSummary } from "@/lib/domain/services";

type RouteContext = {
  params: { userId: string };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const result = await getLedgerSummary(context.params.userId);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
