import { NextRequest } from "next/server";

import { jsonResponse, handleApiError } from "@/lib/api/responses";
import { getInventoryForOrganization } from "@/lib/domain/services";

type RouteContext = {
  params: { organizationId: string };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const result = await getInventoryForOrganization(context.params.organizationId);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
