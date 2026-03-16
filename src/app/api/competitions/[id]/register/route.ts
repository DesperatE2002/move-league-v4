import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { competitionRegistrations, competitions, teamMembers } from "@/db/schema/teams";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// POST /api/competitions/[id]/register — Register team for competition
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;
    const { teamId } = await req.json();
    if (!teamId) {
      return NextResponse.json({ error: "Takım ID gerekli" }, { status: 400 });
    }

    // Check competition exists and is open
    const compArr = await db.select().from(competitions).where(eq(competitions.id, id)).limit(1);
    if (!compArr[0]) {
      return NextResponse.json({ error: "Yarışma bulunamadı" }, { status: 404 });
    }

    if (!["upcoming", "registration_open"].includes(compArr[0].status ?? "")) {
      return NextResponse.json({ error: "Yarışma kayıtları kapalı" }, { status: 400 });
    }

    // Check already registered
    const existing = await db
      .select({ id: competitionRegistrations.id })
      .from(competitionRegistrations)
      .where(
        and(
          eq(competitionRegistrations.competitionId, id),
          eq(competitionRegistrations.teamId, teamId)
        )
      )
      .limit(1);

    if (existing[0]) {
      return NextResponse.json({ error: "Takım zaten kayıtlı" }, { status: 400 });
    }

    await db.insert(competitionRegistrations).values({
      competitionId: id,
      teamId,
      status: "pending",
    });

    return NextResponse.json({ message: "Kayıt başarılı" }, { status: 201 });
  } catch (error) {
    console.error("Register for competition error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
