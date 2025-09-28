import { NextRequest } from "next/server";

import { jsonResponse, handleApiError } from "@/lib/api/responses";
import { respondToConsentRequest } from "@/lib/domain/services";
import { consentDecisionSchema } from "@/lib/domain/schemas";

type RouteContext = {
  params: { requestId: string };
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const payload = await request.json();
    const decision = consentDecisionSchema.parse(payload);
    const result = await respondToConsentRequest(context.params.requestId, decision);

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
