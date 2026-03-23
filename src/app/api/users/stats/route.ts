import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userBadges } from "@/db/schema/badges";
import { badges } from "@/db/schema/badges";
import { dancerRatings } from "@/db/schema/seasons";
import { seasons } from "@/db/schema/seasons";
import { battles } from "@/db/schema/battles";
import { auth } from "@/lib/auth";
import { eq, and, count } from "drizzle-orm";

// GET /api/users/stats — Get user stats for homepage
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get active season
    const activeSeasonArr = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);

    const activeSeason = activeSeasonArr[0] ?? null;

    // Get user rating for active season
    let rating = 1000;
    let wins = 0;
    let losses = 0;
    let totalBattles = 0;
    let peakRating = 1000;

    if (activeSeason) {
      const ratingArr = await db
        .select()
        .from(dancerRatings)
        .where(and(eq(dancerRatings.userId, userId), eq(dancerRatings.seasonId, activeSeason.id)));

      if (ratingArr.length > 0) {
        rating = Math.max(...ratingArr.map(r => r.rating ?? 1000));
        wins = ratingArr.reduce((s, r) => s + (r.wins ?? 0), 0);
        losses = ratingArr.reduce((s, r) => s + (r.losses ?? 0), 0);
        totalBattles = ratingArr.reduce((s, r) => s + (r.totalBattles ?? 0), 0);
        peakRating = Math.max(...ratingArr.map(r => r.peakRating ?? 1000));
      }
    }

    // Get badge count
    const badgeCountArr = await db
      .select({ count: count() })
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    // Get total battle count (all time)
    const allBattlesArr = await db
      .select({ count: count() })
      .from(battles)
      .where(eq(battles.challengerId, userId));

    const allBattlesOpponentArr = await db
      .select({ count: count() })
      .from(battles)
      .where(eq(battles.opponentId, userId));

    const allTimeBattles = (allBattlesArr[0]?.count ?? 0) + (allBattlesOpponentArr[0]?.count ?? 0);

    return NextResponse.json({
      rating,
      wins,
      losses,
      totalBattles,
      peakRating,
      badgeCount: badgeCountArr[0]?.count ?? 0,
      allTimeBattles,
      activeSeason: activeSeason ? { id: activeSeason.id, name: activeSeason.name, endDate: activeSeason.endDate } : null,
    });
  } catch (error) {
    console.error("User stats error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
