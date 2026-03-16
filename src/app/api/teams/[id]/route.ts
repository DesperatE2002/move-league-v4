import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema/teams";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

// GET /api/teams/[id] — Team detail
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

    const teamArr = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    if (!teamArr[0]) {
      return NextResponse.json({ error: "Takım bulunamadı" }, { status: 404 });
    }

    const team = teamArr[0];

    // Coach info
    const coachArr = await db
      .select({ id: users.id, name: users.name, surname: users.surname, username: users.username, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, team.coachId))
      .limit(1);

    // Members
    const membersRaw = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        status: teamMembers.status,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, id));

    const memberUserIds = membersRaw.map((m) => m.userId);
    const memberMap: Record<string, { name: string; surname: string; username: string; avatarUrl: string | null }> = {};
    if (memberUserIds.length > 0) {
      const memberUsers = await db
        .select({ id: users.id, name: users.name, surname: users.surname, username: users.username, avatarUrl: users.avatarUrl })
        .from(users)
        .where(sql`${users.id} IN (${sql.join(memberUserIds.map((uid) => sql`${uid}`), sql`, `)})`);
      for (const u of memberUsers) {
        memberMap[u.id] = { name: u.name, surname: u.surname, username: u.username, avatarUrl: u.avatarUrl };
      }
    }

    // Check if current user is member
    const myMembership = membersRaw.find((m) => m.userId === session.user.id);

    return NextResponse.json({
      ...team,
      coach: coachArr[0] ?? null,
      members: membersRaw.map((m) => ({
        ...m,
        user: memberMap[m.userId] ?? null,
      })),
      myMembership: myMembership ?? null,
      isCoach: team.coachId === session.user.id,
    });
  } catch (error) {
    console.error("Get team detail error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
