import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const badges = pgTable("badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 50 }).unique().notNull(),
  nameTr: varchar("name_tr", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  descriptionTr: text("description_tr"),
  descriptionEn: text("description_en"),
  iconUrl: text("icon_url"),
  criteria: jsonb("criteria"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userBadges = pgTable("user_badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  badgeId: uuid("badge_id")
    .references(() => badges.id)
    .notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
