import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id")
    .references(() => users.id)
    .notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content").notNull(),
  imageData: text("image_data"),
  imageType: varchar("image_type", { length: 100 }),
  fileData: text("file_data"),
  fileType: varchar("file_type", { length: 100 }),
  fileName: text("file_name"),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
