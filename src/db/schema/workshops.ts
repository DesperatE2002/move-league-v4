import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const workshopTypeEnum = pgEnum("workshop_type", ["live", "video"]);
export const workshopDifficultyEnum = pgEnum("workshop_difficulty", [
  "beginner",
  "intermediate",
  "advanced",
]);
export const workshopCurrencyEnum = pgEnum("workshop_currency", [
  "TRY",
  "USD",
  "EUR",
]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "enrolled",
  "completed",
  "cancelled",
]);

export const workshops = pgTable("workshops", {
  id: uuid("id").defaultRandom().primaryKey(),
  coachId: uuid("coach_id")
    .references(() => users.id)
    .notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  type: workshopTypeEnum("type").notNull(),
  danceStyle: varchar("dance_style", { length: 100 }),
  difficulty: workshopDifficultyEnum("difficulty"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  currency: workshopCurrencyEnum("currency").default("TRY"),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  previewUrl: text("preview_url"),
  maxParticipants: integer("max_participants"),
  scheduledDate: timestamp("scheduled_date"),
  durationMinutes: integer("duration_minutes"),
  isPublished: boolean("is_published").default(false),
  isApproved: boolean("is_approved").default(false),
  deletionRequestedAt: timestamp("deletion_requested_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workshopEnrollments = pgTable("workshop_enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  workshopId: uuid("workshop_id")
    .references(() => workshops.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  status: enrollmentStatusEnum("status").default("enrolled"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ([
  index("enrollments_workshop_idx").on(table.workshopId),
  index("enrollments_user_idx").on(table.userId),
]));

export const workshopReviews = pgTable("workshop_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  workshopId: uuid("workshop_id")
    .references(() => workshops.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workshopMessages = pgTable("workshop_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  workshopId: uuid("workshop_id")
    .references(() => workshops.id)
    .notNull(),
  senderId: uuid("sender_id")
    .references(() => users.id)
    .notNull(),
  receiverId: uuid("receiver_id")
    .references(() => users.id)
    .notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Workshop = typeof workshops.$inferSelect;
export type NewWorkshop = typeof workshops.$inferInsert;
export type WorkshopEnrollment = typeof workshopEnrollments.$inferSelect;
export type WorkshopReview = typeof workshopReviews.$inferSelect;
export type WorkshopMessage = typeof workshopMessages.$inferSelect;
