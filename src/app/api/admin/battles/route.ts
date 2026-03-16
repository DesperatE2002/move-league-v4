import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { battles } from "@/db/schema/battles";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

// GET /api/admin/battles — Admin: tüm düelloları listele
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const allBattles = await db
      .select({
        id: battles.id,
        challengerId: battles.challengerId,
        opponentId: battles.opponentId,
        status: battles.status,
        judgeId: battles.judgeId,
        studioId: battles.studioId,
        scheduledDate: battles.scheduledDate,
        createdAt: battles.createdAt,
      })
      .from(battles)
      .orderBy(desc(battles.createdAt))
      .limit(100);

    const filtered = status
      ? allBattles.filter((b) => b.status === status)
      : allBattles;

    // Enrich with user names
    const userIds = new Set<string>();
    for (const b of filtered) {
      userIds.add(b.challengerId);
      userIds.add(b.opponentId);
    }

    const userMap: Record<string, string> = {};
    if (userIds.size > 0) {
      const userRows = await db
        .select({ id: users.id, name: users.name, surname: users.surname })
        .from(users)
        .where(
          sql`${users.id} IN (${sql.join(
            [...userIds].map((id) => sql`${id}`),
            sql`, `
          )})`
        );
      for (const u of userRows) {
        userMap[u.id] = `${u.name} ${u.surname}`;
      }
    }

    const enriched = filtered.map((b) => ({
      ...b,
      challengerName: userMap[b.challengerId] ?? "?",
      opponentName: userMap[b.opponentId] ?? "?",
    }));

    return NextResponse.json({ battles: enriched });
  } catch (error) {
    console.error("Admin battles error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
