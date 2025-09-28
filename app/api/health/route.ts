import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();

    return NextResponse.json({
      status: "ok",
      collections: collections.map((collection) => collection.name)
    });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
