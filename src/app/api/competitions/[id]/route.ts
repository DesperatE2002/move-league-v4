import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { competitions, competitionRegistrations, competitionResults, teams } from "@/db/schema/teams";
import { auth } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

// GET /api/competitions/[id] — Competition detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;

    const compArr = await db.select().from(competitions).where(eq(competitions.id, id)).limit(1);
    if (!compArr[0]) {
      return NextResponse.json({ error: "Yarışma bulunamadı" }, { status: 404 });
    }

    // Registrations
    const regs = await db
      .select({
        id: competitionRegistrations.id,
        teamId: competitionRegistrations.teamId,
        status: competitionRegistrations.status,
        registeredAt: competitionRegistrations.registeredAt,
      })
      .from(competitionRegistrations)
      .where(eq(competitionRegistrations.competitionId, id));

    const teamIds = regs.map((r) => r.teamId);
    const teamMap: Record<string, { name: string; logoUrl: string | null; city: string | null }> = {};
    if (teamIds.length > 0) {
      const teamRows = await db
        .select({ id: teams.id, name: teams.name, logoUrl: teams.logoUrl, city: teams.city })
        .from(teams)
        .where(sql`${teams.id} IN (${sql.join(teamIds.map((tid) => sql`${tid}`), sql`, `)})`);
      for (const t of teamRows) {
        teamMap[t.id] = { name: t.name, logoUrl: t.logoUrl, city: t.city };
      }
    }

    // Results
    const results = await db
      .select()
      .from(competitionResults)
      .where(eq(competitionResults.competitionId, id))
      .orderBy(competitionResults.placement);

    return NextResponse.json({
      ...compArr[0],
      registrations: regs.map((r) => ({
        ...r,
        team: teamMap[r.teamId] ?? null,
      })),
      results: results.map((r) => ({
        ...r,
        team: teamMap[r.teamId] ?? null,
      })),
    });
  } catch (error) {
    console.error("Get competition detail error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
