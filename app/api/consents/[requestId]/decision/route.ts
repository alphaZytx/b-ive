import { NextRequest } from "next/server";

import { jsonResponse, handleApiError } from "@/lib/api/responses";
import { requireApiSession } from "@/lib/auth/api";
import { UnauthorizedError } from "@/lib/domain/errors";
import { respondToConsentRequest } from "@/lib/domain/services";
import { consentDecisionSchema } from "@/lib/domain/schemas";

type RouteContext = {
  params: { requestId: string };
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireApiSession();
    const payload = await request.json();
    const decision = consentDecisionSchema.parse(payload);
    const actorId = session.user?.id;
    const roles = session.user?.roles ?? [];

    if (actorId && decision.actorId !== actorId && !roles.includes("admin")) {
      throw new UnauthorizedError("You may only respond to your own consent requests");
    }

    const result = await respondToConsentRequest(context.params.requestId, decision);

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
