import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const feedbackCategoryEnum = pgEnum("feedback_category", [
  "bug",
  "ui_ux",
  "performance",
  "feature",
  "content",
  "other",
]);

export const feedbackStatusEnum = pgEnum("feedback_status", [
  "new",
  "reviewed",
  "in_progress",
  "resolved",
  "wont_fix",
]);

export const feedbacks = pgTable("feedbacks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  // Core fields
  category: feedbackCategoryEnum("category").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),

  // Structured questions
  overallRating: integer("overall_rating").notNull(), // 1-5
  easeOfUse: integer("ease_of_use").notNull(), // 1-5
  battleSystemRating: integer("battle_system_rating"), // 1-5 optional
  workshopRating: integer("workshop_rating"), // 1-5 optional
  designRating: integer("design_rating"), // 1-5 optional

  // Open-ended
  mostLikedFeature: text("most_liked_feature"),
  mostDislikedFeature: text("most_disliked_feature"),
  missingFeature: text("missing_feature"),
  deviceInfo: varchar("device_info", { length: 300 }),
  browserInfo: varchar("browser_info", { length: 300 }),

  // Admin tracking
  status: feedbackStatusEnum("status").default("new"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;
