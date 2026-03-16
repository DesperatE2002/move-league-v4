import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
  text,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { studios } from "./users";
import { seasons } from "./seasons";

export const battleStatusEnum = pgEnum("battle_status", [
  "pending",
  "accepted",
  "declined",
  "studio_pending",
  "studio_approved",
  "studio_rejected",
  "scheduled",
  "judge_assigned",
  "in_progress",
  "completed",
  "cancelled",
]);

export const battles = pgTable("battles", {
  id: uuid("id").defaultRandom().primaryKey(),
  seasonId: uuid("season_id").references(() => seasons.id),
  challengerId: uuid("challenger_id")
    .references(() => users.id)
    .notNull(),
  opponentId: uuid("opponent_id")
    .references(() => users.id)
    .notNull(),
  studioId: uuid("studio_id").references(() => studios.id),
  judgeId: uuid("judge_id").references(() => users.id),
  status: battleStatusEnum("status").default("pending").notNull(),
  scheduledDate: timestamp("scheduled_date"),
  challengerScore: integer("challenger_score"),
  opponentScore: integer("opponent_score"),
  winnerId: uuid("winner_id").references(() => users.id),
  ratingChange: integer("rating_change"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const battleStudioPreferences = pgTable("battle_studio_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  battleId: uuid("battle_id")
    .references(() => battles.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  studioId: uuid("studio_id")
    .references(() => studios.id)
    .notNull(),
  rank: integer("rank").notNull(),
});

export const battleScores = pgTable("battle_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  battleId: uuid("battle_id")
    .references(() => battles.id)
    .notNull(),
  judgeId: uuid("judge_id")
    .references(() => users.id)
    .notNull(),
  dancerId: uuid("dancer_id")
    .references(() => users.id)
    .notNull(),
  technique: integer("technique").notNull(),
  creativity: integer("creativity").notNull(),
  musicality: integer("musicality").notNull(),
  stagePresence: integer("stage_presence").notNull(),
  totalScore: integer("total_score").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Battle = typeof battles.$inferSelect;
export type NewBattle = typeof battles.$inferInsert;
