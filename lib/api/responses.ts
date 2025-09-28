import { NextResponse } from "next/server";

import { DomainError } from "@/lib/domain/errors";

export function jsonResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function handleApiError(error: unknown) {
  if (error instanceof DomainError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code
      },
      { status: error.status }
    );
  }

  console.error("Unhandled API error", error);
  return NextResponse.json(
    {
      error: "Internal server error"
    },
    { status: 500 }
  );
}
