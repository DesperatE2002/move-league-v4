import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema/teams";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { createTeamSchema } from "@/lib/validators";
import { desc, sql, eq, count } from "drizzle-orm";

// GET /api/teams — List teams
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const rows = await db.select().from(teams).orderBy(desc(teams.createdAt)).limit(100);

    const coachIds = [...new Set(rows.map((t) => t.coachId))];
    const coachMap: Record<string, { name: string; surname: string; username: string }> = {};
    if (coachIds.length > 0) {
      const coaches = await db
        .select({ id: users.id, name: users.name, surname: users.surname, username: users.username })
        .from(users)
        .where(sql`${users.id} IN (${sql.join(coachIds.map((id) => sql`${id}`), sql`, `)})`);
      for (const c of coaches) {
        coachMap[c.id] = { name: c.name, surname: c.surname, username: c.username };
      }
    }

    // Member counts
    const teamIds = rows.map((t) => t.id);
    const memberCountMap: Record<string, number> = {};
    if (teamIds.length > 0) {
      const counts = await db
        .select({ teamId: teamMembers.teamId, count: count() })
        .from(teamMembers)
        .where(sql`${teamMembers.teamId} IN (${sql.join(teamIds.map((id) => sql`${id}`), sql`, `)}) AND ${teamMembers.status} = 'active'`)
        .groupBy(teamMembers.teamId);
      for (const c of counts) {
        memberCountMap[c.teamId] = c.count;
      }
    }

    return NextResponse.json(
      rows.map((t) => ({
        ...t,
        coach: coachMap[t.coachId] ?? null,
        memberCount: memberCountMap[t.id] ?? 0,
      }))
    );
  } catch (error) {
    console.error("Get teams error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/teams — Create team (coach only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    if (session.user.role !== "coach" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Sadece koçlar takım oluşturabilir" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Geçersiz veri" }, { status: 400 });
    }

    const newTeam = await db
      .insert(teams)
      .values({
        coachId: session.user.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        city: parsed.data.city || null,
        country: parsed.data.country || null,
      })
      .returning({ id: teams.id });

    return NextResponse.json({ message: "Takım oluşturuldu", id: newTeam[0].id }, { status: 201 });
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
