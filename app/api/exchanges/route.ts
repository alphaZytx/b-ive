import { NextRequest } from "next/server";

import { jsonResponse, handleApiError } from "@/lib/api/responses";
import { requireApiRole } from "@/lib/auth/api";
import { createExchangeProposal } from "@/lib/domain/services";
import { exchangeProposalSchema } from "@/lib/domain/schemas";

export async function POST(request: NextRequest) {
  try {
    await requireApiRole(["organization", "admin"]);
    const payload = await request.json();
    const data = exchangeProposalSchema.parse(payload);
    const result = await createExchangeProposal(data);

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
