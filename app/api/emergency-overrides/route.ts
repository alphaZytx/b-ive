import { NextRequest } from "next/server";

import { jsonResponse, handleApiError } from "@/lib/api/responses";
import { requireApiRole } from "@/lib/auth/api";
import { UnauthorizedError } from "@/lib/domain/errors";
import { applyEmergencyOverride } from "@/lib/domain/services";
import { emergencyOverrideSchema } from "@/lib/domain/schemas";

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiRole(["admin", "government"]);
    const payload = await request.json();
    const data = emergencyOverrideSchema.parse(payload);

    const actorId = session.user?.id;
    if (actorId && data.initiatedBy !== actorId && !session.user?.roles.includes("admin")) {
      throw new UnauthorizedError("Emergency overrides must be recorded by the acting administrator");
    }

    const result = await applyEmergencyOverride(data);

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
