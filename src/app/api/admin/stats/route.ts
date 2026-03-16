import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { battles } from "@/db/schema/battles";
import { seasons } from "@/db/schema/seasons";
import { auth } from "@/lib/auth";
import { eq, count } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const [userCount, battleCount, completedCount, activeSeasonArr] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(battles),
      db.select({ count: count() }).from(battles).where(eq(battles.status, "completed")),
      db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1),
    ]);

    const activeBattleCount = await db
      .select({ count: count() })
      .from(battles)
      .where(eq(battles.status, "accepted"));

    return NextResponse.json({
      totalUsers: userCount[0]?.count ?? 0,
      totalBattles: battleCount[0]?.count ?? 0,
      activeBattles: activeBattleCount[0]?.count ?? 0,
      completedBattles: completedCount[0]?.count ?? 0,
      activeSeason: activeSeasonArr[0]?.name ?? null,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
