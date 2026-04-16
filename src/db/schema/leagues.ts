import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users, studios } from "./users";

export const leagueStatusEnum = pgEnum("league_status", [
  "draft",
  "active",
  "completed",
  "cancelled",
]);

export const leagueInviteStatusEnum = pgEnum("league_invite_status", [
  "pending",
  "accepted",
  "declined",
]);

// Özel Ligler — Stüdyoların kendi iç lig sistemi
export const privateLeagues = pgTable("private_leagues", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .references(() => users.id)
    .notNull(),
  studioId: uuid("studio_id").references(() => studios.id),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  danceStyle: varchar("dance_style", { length: 100 }),
  maxMembers: integer("max_members").default(20),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: leagueStatusEnum("status").default("draft").notNull(),
  firstPrize: varchar("first_prize", { length: 300 }),
  secondPrize: varchar("second_prize", { length: 300 }),
  thirdPrize: varchar("third_prize", { length: 300 }),
  rules: text("rules"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ([
  index("leagues_owner_idx").on(table.ownerId),
  index("leagues_status_idx").on(table.status),
  index("leagues_studio_idx").on(table.studioId),
]));

// Lig Üyeleri
export const leagueMembers = pgTable("league_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  leagueId: uuid("league_id")
    .references(() => privateLeagues.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  rating: integer("rating").default(1000),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  draws: integer("draws").default(0),
  totalBattles: integer("total_battles").default(0),
  peakRating: integer("peak_rating").default(1000),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ([
  index("league_members_league_idx").on(table.leagueId),
  index("league_members_user_idx").on(table.userId),
  index("league_members_rating_idx").on(table.leagueId, table.rating),
]));

// Lig Davetleri
export const leagueInvites = pgTable("league_invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  leagueId: uuid("league_id")
    .references(() => privateLeagues.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  status: leagueInviteStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
}, (table) => ([
  index("league_invites_user_idx").on(table.userId),
  index("league_invites_league_idx").on(table.leagueId),
]));

// Lig İçi Düellolar
export const leagueBattles = pgTable("league_battles", {
  id: uuid("id").defaultRandom().primaryKey(),
  leagueId: uuid("league_id")
    .references(() => privateLeagues.id)
    .notNull(),
  challengerId: uuid("challenger_id")
    .references(() => users.id)
    .notNull(),
  opponentId: uuid("opponent_id")
    .references(() => users.id)
    .notNull(),
  winnerId: uuid("winner_id").references(() => users.id),
  challengerScore: integer("challenger_score"),
  opponentScore: integer("opponent_score"),
  ratingChange: integer("rating_change"),
  status: varchar("status", { length: 30 }).default("pending").notNull(),
  scheduledDate: timestamp("scheduled_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ([
  index("league_battles_league_idx").on(table.leagueId),
  index("league_battles_status_idx").on(table.status),
]));

export type PrivateLeague = typeof privateLeagues.$inferSelect;
export type LeagueMember = typeof leagueMembers.$inferSelect;
export type LeagueInvite = typeof leagueInvites.$inferSelect;
export type LeagueBattle = typeof leagueBattles.$inferSelect;
