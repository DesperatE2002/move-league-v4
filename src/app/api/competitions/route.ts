import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { competitions, competitionRegistrations } from "@/db/schema/teams";
import { auth } from "@/lib/auth";
import { createCompetitionSchema } from "@/lib/validators";
import { desc, count, sql, eq } from "drizzle-orm";

// GET /api/competitions — List competitions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const rows = await db.select().from(competitions).orderBy(desc(competitions.startDate)).limit(50);

    // Registration counts
    const compIds = rows.map((c) => c.id);
    const regCountMap: Record<string, number> = {};
    if (compIds.length > 0) {
      const counts = await db
        .select({ competitionId: competitionRegistrations.competitionId, count: count() })
        .from(competitionRegistrations)
        .where(sql`${competitionRegistrations.competitionId} IN (${sql.join(compIds.map((id) => sql`${id}`), sql`, `)})`)
        .groupBy(competitionRegistrations.competitionId);
      for (const c of counts) {
        regCountMap[c.competitionId] = c.count;
      }
    }

    return NextResponse.json(
      rows.map((c) => ({
        ...c,
        registrationCount: regCountMap[c.id] ?? 0,
      }))
    );
  } catch (error) {
    console.error("Get competitions error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/competitions — Create competition (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createCompetitionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Geçersiz veri" }, { status: 400 });
    }

    const data = parsed.data;
    const newComp = await db
      .insert(competitions)
      .values({
        name: data.name,
        description: data.description || null,
        type: data.type,
        city: data.city || null,
        country: data.country || null,
        venue: data.venue || null,
        startDate: data.startDate,
        endDate: data.endDate,
        maxTeams: data.maxTeams || null,
        registrationDeadline: data.registrationDeadline || null,
        status: "upcoming",
      })
      .returning({ id: competitions.id });

    return NextResponse.json({ message: "Yarışma oluşturuldu", id: newComp[0].id }, { status: 201 });
  } catch (error) {
    console.error("Create competition error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
