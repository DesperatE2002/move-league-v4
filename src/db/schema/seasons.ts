import {
  pgTable,
  uuid,
  integer,
  timestamp,
  boolean,
  date,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const seasons = pgTable("seasons", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dancerRatings = pgTable("dancer_ratings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  seasonId: uuid("season_id")
    .references(() => seasons.id)
    .notNull(),
  rating: integer("rating").default(1000),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  draws: integer("draws").default(0),
  totalBattles: integer("total_battles").default(0),
  peakRating: integer("peak_rating").default(1000),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Season = typeof seasons.$inferSelect;
export type NewSeason = typeof seasons.$inferInsert;
export type DancerRating = typeof dancerRatings.$inferSelect;
