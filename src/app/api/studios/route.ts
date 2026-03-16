import { NextResponse } from "next/server";
import { db } from "@/db";
import { studios } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// GET /api/studios — List available studios
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const result = await db
      .select({
        id: studios.id,
        name: studios.name,
        city: studios.city,
        country: studios.country,
        address: studios.address,
        isVerified: studios.isVerified,
      })
      .from(studios)
      .where(
        and(
          eq(studios.isAvailable, true)
        )
      );

    return NextResponse.json({ studios: result });
  } catch (error) {
    console.error("Get studios error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
