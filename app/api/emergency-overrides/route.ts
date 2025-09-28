import { NextRequest } from "next/server";

import { jsonResponse, handleApiError } from "@/lib/api/responses";
import { applyEmergencyOverride } from "@/lib/domain/services";
import { emergencyOverrideSchema } from "@/lib/domain/schemas";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = emergencyOverrideSchema.parse(payload);
    const result = await applyEmergencyOverride(data);

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
