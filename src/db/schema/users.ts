import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
  integer,
  time,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "dancer",
  "coach",
  "studio",
  "judge",
  "admin",
]);

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const languageEnum = pgEnum("language", ["tr", "en"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 100 }).notNull(),
  surname: varchar("surname", { length: 100 }).notNull(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  role: roleEnum("role").notNull().default("dancer"),
  avatarUrl: text("avatar_url"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  gender: genderEnum("gender"),
  danceStyle: varchar("dance_style", { length: 100 }),
  bio: text("bio"),
  language: languageEnum("language").default("tr"),
  emailVerified: boolean("email_verified").default(false),
  isActive: boolean("is_active").default(true),
  kvkkConsent: boolean("kvkk_consent").default(false),
  termsConsent: boolean("terms_consent").default(false),
  marketingConsent: boolean("marketing_consent").default(false),
  consentAt: timestamp("consent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const studios = pgTable("studios", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .references(() => users.id)
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  isVerified: boolean("is_verified").default(false),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Studio = typeof studios.$inferSelect;
export type NewStudio = typeof studios.$inferInsert;

export const studioAvailability = pgTable("studio_availability", {
  id: uuid("id").defaultRandom().primaryKey(),
  studioId: uuid("studio_id")
    .references(() => studios.id)
    .notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isAvailable: boolean("is_available").default(true),
});

export type StudioAvailability = typeof studioAvailability.$inferSelect;
