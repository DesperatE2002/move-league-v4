import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { battles } from "@/db/schema/battles";
import { users, studios } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, sql, desc } from "drizzle-orm";

// GET /api/studios/battles — Stüdyo sahibinin battle'larını getir
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    // Find studio owned by this user
    const studioArr = await db
      .select({ id: studios.id, name: studios.name })
      .from(studios)
      .where(eq(studios.ownerId, session.user.id))
      .limit(1);

    if (studioArr.length === 0) {
      return NextResponse.json({ error: "Stüdyo bulunamadı" }, { status: 404 });
    }

    const studioId = studioArr[0].id;

    // Get all battles assigned to this studio
    const studioBattles = await db
      .select({
        id: battles.id,
        challengerId: battles.challengerId,
        opponentId: battles.opponentId,
        status: battles.status,
        scheduledDate: battles.scheduledDate,
        danceStyle: battles.danceStyle,
        challengerScore: battles.challengerScore,
        opponentScore: battles.opponentScore,
        winnerId: battles.winnerId,
        ratingChange: battles.ratingChange,
        createdAt: battles.createdAt,
        updatedAt: battles.updatedAt,
      })
      .from(battles)
      .where(eq(battles.studioId, studioId))
      .orderBy(desc(battles.createdAt))
      .limit(100);

    // Enrich with user info
    const userIds = new Set<string>();
    for (const b of studioBattles) {
      userIds.add(b.challengerId);
      userIds.add(b.opponentId);
    }

    const userMap: Record<string, { name: string; surname: string; username: string; avatarUrl: string | null }> = {};
    if (userIds.size > 0) {
      const userRows = await db
        .select({
          id: users.id,
          name: users.name,
          surname: users.surname,
          username: users.username,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(
          sql`${users.id} IN (${sql.join(
            [...userIds].map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      for (const u of userRows) {
        userMap[u.id] = { name: u.name, surname: u.surname, username: u.username, avatarUrl: u.avatarUrl };
      }
    }

    const enriched = studioBattles.map((b) => ({
      ...b,
      challenger: userMap[b.challengerId] ?? null,
      opponent: userMap[b.opponentId] ?? null,
    }));

    return NextResponse.json({
      studio: studioArr[0],
      battles: enriched,
    });
  } catch (error) {
    console.error("Studio battles error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
