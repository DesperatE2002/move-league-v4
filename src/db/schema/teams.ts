import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  date,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { seasons } from "./seasons";

export const teamMemberStatusEnum = pgEnum("team_member_status", [
  "invited",
  "active",
  "removed",
]);

export const competitionTypeEnum = pgEnum("competition_type", [
  "solo",
  "team",
]);

export const competitionStatusEnum = pgEnum("competition_status", [
  "upcoming",
  "registration_open",
  "registration_closed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const compRegStatusEnum = pgEnum("comp_reg_status", [
  "pending",
  "approved",
  "rejected",
]);

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  coachId: uuid("coach_id")
    .references(() => users.id)
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .references(() => teams.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  status: teamMemberStatusEnum("status").default("invited"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const competitions = pgTable("competitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  seasonId: uuid("season_id").references(() => seasons.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: competitionTypeEnum("type").notNull(),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  venue: text("venue"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  maxTeams: integer("max_teams"),
  registrationDeadline: date("registration_deadline"),
  status: competitionStatusEnum("status").default("upcoming"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const competitionRegistrations = pgTable("competition_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  competitionId: uuid("competition_id")
    .references(() => competitions.id)
    .notNull(),
  teamId: uuid("team_id")
    .references(() => teams.id)
    .notNull(),
  status: compRegStatusEnum("status").default("pending"),
  registeredAt: timestamp("registered_at").defaultNow(),
});

export const competitionResults = pgTable("competition_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  competitionId: uuid("competition_id")
    .references(() => competitions.id)
    .notNull(),
  teamId: uuid("team_id")
    .references(() => teams.id)
    .notNull(),
  placement: integer("placement").notNull(),
  totalScore: decimal("total_score", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Competition = typeof competitions.$inferSelect;
export type NewCompetition = typeof competitions.$inferInsert;
export type CompetitionRegistration = typeof competitionRegistrations.$inferSelect;
export type CompetitionResult = typeof competitionResults.$inferSelect;
