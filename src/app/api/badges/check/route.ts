import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { badges, userBadges } from "@/db/schema/badges";
import { dancerRatings } from "@/db/schema/seasons";
import { battles } from "@/db/schema/battles";
import { auth } from "@/lib/auth";
import { eq, and, count } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

interface BadgeCriteria {
  type: string;
  value: number;
}

// POST /api/badges/check — Check and award badges for a user after an event
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await req.json();
    const { userId } = body as { userId: string };
    const targetUserId = userId || session.user.id;

    const allBadges = await db.select().from(badges);
    const existingUserBadges = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, targetUserId));

    const existingBadgeIds = new Set(existingUserBadges.map((ub) => ub.badgeId));
    const earnedBadges: string[] = [];

    // Get user stats
    const [winCount, totalCount] = await Promise.all([
      db.select({ count: count() }).from(battles).where(and(eq(battles.winnerId, targetUserId), eq(battles.status, "completed"))),
      db.select({ count: count() }).from(battles).where(eq(battles.status, "completed")),
    ]);

    const wins = winCount[0]?.count ?? 0;

    for (const badge of allBadges) {
      if (existingBadgeIds.has(badge.id)) continue;

      const criteria = badge.criteria as BadgeCriteria | null;
      if (!criteria) continue;

      let earned = false;

      switch (criteria.type) {
        case "wins":
          earned = wins >= criteria.value;
          break;
        case "battles":
          const userBattleCount = await db
            .select({ count: count() })
            .from(battles)
            .where(eq(battles.status, "completed"));
          earned = (userBattleCount[0]?.count ?? 0) >= criteria.value;
          break;
        case "rating":
          const ratings = await db
            .select()
            .from(dancerRatings)
            .where(eq(dancerRatings.userId, targetUserId));
          earned = ratings.some((r) => (r.rating ?? 0) >= criteria.value);
          break;
      }

      if (earned) {
        await db.insert(userBadges).values({
          userId: targetUserId,
          badgeId: badge.id,
        });
        earnedBadges.push(badge.id);

        await createNotification(
          targetUserId,
          "badge_earned",
          "Yeni Rozet Kazandınız!",
          `${badge.nameTr} rozetini kazandınız! Tebrikler!`,
          { badgeId: badge.id }
        );
      }
    }

    return NextResponse.json({ earned: earnedBadges.length, badges: earnedBadges });
  } catch (error) {
    console.error("Badge check error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
