import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dancerRatings } from "@/db/schema/seasons";
import { seasons } from "@/db/schema/seasons";
import { battles } from "@/db/schema/battles";
import { userBadges } from "@/db/schema/badges";
import { auth } from "@/lib/auth";
import { eq, and, or, count } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/users/[id]/stats — Get user stats
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;

    // Get active season
    const activeSeasonArr = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);

    const activeSeason = activeSeasonArr[0] ?? null;

    let rating = 1000;
    let wins = 0;
    let losses = 0;
    let totalBattles = 0;
    let peakRating = 1000;

    if (activeSeason) {
      const ratingArr = await db
        .select()
        .from(dancerRatings)
        .where(and(eq(dancerRatings.userId, id), eq(dancerRatings.seasonId, activeSeason.id)));

      if (ratingArr.length > 0) {
        rating = Math.max(...ratingArr.map(r => r.rating ?? 1000));
        wins = ratingArr.reduce((s, r) => s + (r.wins ?? 0), 0);
        losses = ratingArr.reduce((s, r) => s + (r.losses ?? 0), 0);
        totalBattles = ratingArr.reduce((s, r) => s + (r.totalBattles ?? 0), 0);
        peakRating = Math.max(...ratingArr.map(r => r.peakRating ?? 1000));
      }
    }

    // Badge count
    const badgeCountArr = await db
      .select({ count: count() })
      .from(userBadges)
      .where(eq(userBadges.userId, id));

    // All-time battle count
    const allBattlesArr = await db
      .select({ count: count() })
      .from(battles)
      .where(or(eq(battles.challengerId, id), eq(battles.opponentId, id)));

    return NextResponse.json({
      rating,
      wins,
      losses,
      totalBattles,
      peakRating,
      badgeCount: badgeCountArr[0]?.count ?? 0,
      allTimeBattles: allBattlesArr[0]?.count ?? 0,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
