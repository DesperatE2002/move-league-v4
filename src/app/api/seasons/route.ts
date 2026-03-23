import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { seasons, dancerRatings } from "@/db/schema/seasons";
import { battles } from "@/db/schema/battles";
import { competitions } from "@/db/schema/teams";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// GET /api/seasons — Sezonları listele
export async function GET() {
  try {
    const result = await db
      .select()
      .from(seasons)
      .orderBy(desc(seasons.createdAt));

    return NextResponse.json({ seasons: result });
  } catch (error) {
    console.error("Get seasons error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/seasons — Sezon oluştur (admin)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await req.json();
    const { name, startDate, endDate, firstPrize, secondPrize, thirdPrize } = body as {
      name: string;
      startDate: string;
      endDate: string;
      firstPrize?: string;
      secondPrize?: string;
      thirdPrize?: string;
    };

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Tüm alanlar zorunlu" }, { status: 400 });
    }

    // Deactivate other seasons
    await db.update(seasons).set({ isActive: false }).where(eq(seasons.isActive, true));

    const newSeason = await db
      .insert(seasons)
      .values({
        name,
        startDate,
        endDate,
        isActive: true,
        firstPrize: firstPrize?.trim() || null,
        secondPrize: secondPrize?.trim() || null,
        thirdPrize: thirdPrize?.trim() || null,
      })
      .returning();

    return NextResponse.json({ message: "Sezon oluşturuldu", season: newSeason[0] }, { status: 201 });
  } catch (error) {
    console.error("Create season error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/seasons?id=xxx — Sezonu sil (admin)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Sezon ID gerekli" }, { status: 400 });
    }

    // Nullify seasonId in battles and competitions
    await db.update(battles).set({ seasonId: null }).where(eq(battles.seasonId, id));
    await db.update(competitions).set({ seasonId: null }).where(eq(competitions.seasonId, id));

    // Delete dancer ratings for this season
    await db.delete(dancerRatings).where(eq(dancerRatings.seasonId, id));

    // Delete the season
    await db.delete(seasons).where(eq(seasons.id, id));

    return NextResponse.json({ message: "Sezon silindi" });
  } catch (error) {
    console.error("Delete season error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
