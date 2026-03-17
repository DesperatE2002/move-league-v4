import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const consentTypeEnum = pgEnum("consent_type", [
  "kvkk",
  "terms",
  "privacy",
  "marketing",
  "cookie",
]);

export const consentActionEnum = pgEnum("consent_action", [
  "granted",
  "withdrawn",
]);

// Detailed consent log — every grant/withdraw is recorded (KVKK Article 5-6 ispat)
export const userConsents = pgTable("user_consents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  consentType: consentTypeEnum("consent_type").notNull(),
  action: consentActionEnum("action").notNull(),
  version: varchar("version", { length: 20 }).notNull().default("1.0"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Data deletion requests — KVKK Article 7 (Silme hakkı)
export const dataDeletionRequests = pgTable("data_deletion_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, completed, rejected
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: uuid("processed_by").references(() => users.id),
});

export type UserConsent = typeof userConsents.$inferSelect;
export type DataDeletionRequest = typeof dataDeletionRequests.$inferSelect;
