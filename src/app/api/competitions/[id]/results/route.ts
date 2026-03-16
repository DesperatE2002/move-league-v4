import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { competitions, competitionResults } from "@/db/schema/teams";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/competitions/[id]/results — Enter competition results (admin)
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
    }

    const { id } = await ctx.params;

    // Check competition exists
    const compArr = await db
      .select()
      .from(competitions)
      .where(eq(competitions.id, id))
      .limit(1);

    if (!compArr[0]) {
      return NextResponse.json({ error: "Yarışma bulunamadı" }, { status: 404 });
    }

    const body = await req.json();
    const { results } = body as {
      results: Array<{
        teamId: string;
        placement: number;
        totalScore?: string;
        notes?: string;
      }>;
    };

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "Sonuçlar gerekli" }, { status: 400 });
    }

    // Clear existing results and insert new
    await db
      .delete(competitionResults)
      .where(eq(competitionResults.competitionId, id));

    await db.insert(competitionResults).values(
      results.map((r) => ({
        competitionId: id,
        teamId: r.teamId,
        placement: r.placement,
        totalScore: r.totalScore ?? null,
        notes: r.notes ?? null,
      }))
    );

    // Mark competition as completed
    await db
      .update(competitions)
      .set({ status: "completed" })
      .where(eq(competitions.id, id));

    return NextResponse.json({ message: "Sonuçlar kaydedildi" }, { status: 201 });
  } catch (error) {
    console.error("Enter competition results error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
