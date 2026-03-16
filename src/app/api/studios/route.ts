import { NextRequest, NextResponse } from "next/server";
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

// POST /api/studios — Create studio
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    if (session.user.role !== "studio" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, address, city, country, phone } = body;

    if (!name || !address || !city || !country) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik" }, { status: 400 });
    }

    const result = await db
      .insert(studios)
      .values({
        ownerId: session.user.id,
        name,
        description: description || null,
        address,
        city,
        country,
        phone: phone || null,
      })
      .returning();

    return NextResponse.json({ studio: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Create studio error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
