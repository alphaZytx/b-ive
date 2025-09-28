import { NextRequest } from "next/server";

import { jsonResponse, handleApiError } from "@/lib/api/responses";
import { requireApiRole } from "@/lib/auth/api";
import { createConsentRequest } from "@/lib/domain/services";
import { consentRequestSchema } from "@/lib/domain/schemas";

export async function POST(request: NextRequest) {
  try {
    await requireApiRole(["organization", "admin"]);
    const payload = await request.json();
    const data = consentRequestSchema.parse(payload);
    const result = await createConsentRequest(data);

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
