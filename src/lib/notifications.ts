import { db } from "@/db";
import { notifications } from "@/db/schema/notifications";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { sendNotificationEmail } from "@/lib/email";

type NotificationType =
  | "battle_request"
  | "battle_accepted"
  | "battle_declined"
  | "battle_scheduled"
  | "battle_reminder"
  | "battle_result"
  | "judge_assigned"
  | "workshop_purchased"
  | "team_invite"
  | "competition_announce"
  | "season_end"
  | "badge_earned"
  | "admin_announcement";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  await db.insert(notifications).values({
    userId,
    type,
    title,
    message,
    data: data ?? null,
    channel: "in_app",
  });

  // Also send email notification (fire and forget)
  try {
    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.email) {
      sendNotificationEmail(user.email, user.name, type, title, message, data);
    }
  } catch {
    // Email failure should not block notification creation
  }
}
