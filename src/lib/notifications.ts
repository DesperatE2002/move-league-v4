import { db } from "@/db";
import { notifications } from "@/db/schema/notifications";

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
}
