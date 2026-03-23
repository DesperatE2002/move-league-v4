import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dancerRatings, seasons } from "@/db/schema/seasons";
import { users } from "@/db/schema/users";
import { eq, desc, and } from "drizzle-orm";
import { DANCE_STYLES } from "@/lib/dance-styles";

// GET /api/rankings — Sıralama tablosu
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");
    const city = searchParams.get("city");
    const style = searchParams.get("style");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Validate dance style
    if (!style || !DANCE_STYLES.includes(style as typeof DANCE_STYLES[number])) {
      return NextResponse.json({ rankings: [], season: null });
    }

    // Get active season
    const activeSeason = await db
      .select({ id: seasons.id })
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);

    if (activeSeason.length === 0) {
      return NextResponse.json({ rankings: [], season: null });
    }

    const seasonId = activeSeason[0].id;

    // Build query with filters — per dance style
    const conditions = [
      eq(dancerRatings.seasonId, seasonId),
      eq(dancerRatings.danceStyle, style),
    ];

    let rankings = await db
      .select({
        userId: dancerRatings.userId,
        rating: dancerRatings.rating,
        wins: dancerRatings.wins,
        losses: dancerRatings.losses,
        draws: dancerRatings.draws,
        totalBattles: dancerRatings.totalBattles,
        peakRating: dancerRatings.peakRating,
        name: users.name,
        surname: users.surname,
        username: users.username,
        avatarUrl: users.avatarUrl,
        city: users.city,
        country: users.country,
      })
      .from(dancerRatings)
      .innerJoin(users, eq(dancerRatings.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(dancerRatings.rating))
      .limit(limit);

    // Apply post-query filters for city/country
    if (country) {
      rankings = rankings.filter((r) => r.country?.toLowerCase() === country.toLowerCase());
    }
    if (city) {
      rankings = rankings.filter((r) => r.city?.toLowerCase() === city.toLowerCase());
    }

    // Add rank numbers
    const ranked = rankings.map((r, i) => ({ ...r, rank: i + 1 }));

    return NextResponse.json({ rankings: ranked, seasonId });
  } catch (error) {
    console.error("Rankings error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
