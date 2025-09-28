import { NextRequest } from "next/server";

import { jsonResponse, handleApiError } from "@/lib/api/responses";
import { requireApiRole } from "@/lib/auth/api";
import { recordDonation } from "@/lib/domain/services";
import { donationInputSchema } from "@/lib/domain/schemas";

export async function POST(request: NextRequest) {
  try {
    await requireApiRole(["organization", "admin"]);
    const payload = await request.json();
    const data = donationInputSchema.parse(payload);
    const result = await recordDonation(data);

    return jsonResponse(
      {
        transactionId: result.transactionId
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
