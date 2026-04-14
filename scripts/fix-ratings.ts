import { db } from "../src/db";
import { dancerRatings } from "../src/db/schema/seasons";
import { users } from "../src/db/schema/users";
import { eq, and } from "drizzle-orm";

async function main() {
  // Find Berkay and Hüsnü's ratings
  const allRatings = await db.select().from(dancerRatings);
  
  for (const r of allRatings) {
    const u = await db.select({ name: users.name }).from(users).where(eq(users.id, r.userId)).limit(1);
    const name = u[0]?.name || "Unknown";
    
    if (name === "Berkay") {
      // Berkay LOST but got 1020 — should be 980
      console.log(`Fixing ${name}: ${r.rating} -> 980`);
      await db.update(dancerRatings).set({ rating: 980, peakRating: 1000 }).where(eq(dancerRatings.id, r.id));
    } else if (name === "Hüsnü") {
      // Hüsnü WON but got 980 — should be 1020
      console.log(`Fixing ${name}: ${r.rating} -> 1020`);
      await db.update(dancerRatings).set({ rating: 1020, peakRating: 1020 }).where(eq(dancerRatings.id, r.id));
    }
  }
  
  console.log("Ratings corrected!");
  
  // Verify
  const updated = await db.select().from(dancerRatings);
  for (const r of updated) {
    const u = await db.select({ name: users.name, surname: users.surname }).from(users).where(eq(users.id, r.userId)).limit(1);
    console.log(`${u[0]?.name} ${u[0]?.surname} | Rating: ${r.rating} | W:${r.wins} L:${r.losses} | Peak:${r.peakRating}`);
  }
  
  process.exit(0);
}

main().catch(console.error);
