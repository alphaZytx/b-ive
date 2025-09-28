import { NextRequest } from "next/server";

import { jsonResponse, handleApiError } from "@/lib/api/responses";
import { requireApiSession } from "@/lib/auth/api";
import { UnauthorizedError } from "@/lib/domain/errors";
import { getInventoryForOrganization } from "@/lib/domain/services";

type RouteContext = {
  params: { organizationId: string };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireApiSession();
    const roles = session.user?.roles ?? [];
    const organizationId = context.params.organizationId;

    if (roles.includes("organization")) {
      if (!session.user?.organizationId || session.user.organizationId !== organizationId) {
        throw new UnauthorizedError("You can only view inventory for your organization");
      }
    } else if (!roles.some((role) => ["admin", "government"].includes(role))) {
      throw new UnauthorizedError();
    }

    const result = await getInventoryForOrganization(context.params.organizationId);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
