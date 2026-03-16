import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { badges, userBadges } from "@/db/schema/badges";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const allBadges = await db.select().from(badges).orderBy(badges.createdAt);

    return NextResponse.json({ badges: allBadges });
  } catch (error) {
    console.error("Get badges error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await req.json();
    const { key, nameTr, nameEn, descriptionTr, descriptionEn } = body as {
      key: string;
      nameTr: string;
      nameEn: string;
      descriptionTr?: string;
      descriptionEn?: string;
    };

    if (!key || !nameTr || !nameEn) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik" }, { status: 400 });
    }

    // Check duplicate key
    const existing = await db.select().from(badges).where(eq(badges.key, key)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Bu anahtar zaten mevcut" }, { status: 400 });
    }

    const [newBadge] = await db.insert(badges).values({
      key,
      nameTr,
      nameEn,
      descriptionTr: descriptionTr || null,
      descriptionEn: descriptionEn || null,
    }).returning();

    return NextResponse.json({ badge: newBadge }, { status: 201 });
  } catch (error) {
    console.error("Create badge error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
