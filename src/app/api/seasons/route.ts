import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { seasons } from "@/db/schema/seasons";
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
    const { name, startDate, endDate } = body as {
      name: string;
      startDate: string;
      endDate: string;
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
      })
      .returning();

    return NextResponse.json({ message: "Sezon oluşturuldu", season: newSeason[0] }, { status: 201 });
  } catch (error) {
    console.error("Create season error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
