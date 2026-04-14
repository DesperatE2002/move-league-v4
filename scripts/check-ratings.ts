import { db } from "../src/db";
import { dancerRatings } from "../src/db/schema/seasons";
import { users } from "../src/db/schema/users";
import { eq, desc } from "drizzle-orm";

async function main() {
  const ratings = await db
    .select({
      userId: dancerRatings.userId,
      rating: dancerRatings.rating,
      wins: dancerRatings.wins,
      losses: dancerRatings.losses,
      totalBattles: dancerRatings.totalBattles,
      peakRating: dancerRatings.peakRating,
      danceStyle: dancerRatings.danceStyle,
      seasonId: dancerRatings.seasonId,
    })
    .from(dancerRatings)
    .orderBy(desc(dancerRatings.rating));

  for (const r of ratings) {
    const u = await db.select({ name: users.name, surname: users.surname }).from(users).where(eq(users.id, r.userId)).limit(1);
    console.log(`${u[0]?.name} ${u[0]?.surname} | Rating: ${r.rating} | W:${r.wins} L:${r.losses} | Battles:${r.totalBattles} | Peak:${r.peakRating} | Style:${r.danceStyle}`);
  }
  process.exit(0);
}

main().catch(console.error);
