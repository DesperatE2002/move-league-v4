import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { notifications } from "@/db/schema/notifications";
import { auth } from "@/lib/auth";
import { ne, eq } from "drizzle-orm";
import { sendNotificationEmail } from "@/lib/email";

// POST /api/admin/announcements — Send announcement (bulk to all or to specific user)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await req.json();
    const { title, message, userId } = body as { title: string; message: string; userId?: string };

    if (!title || !message) {
      return NextResponse.json({ error: "Başlık ve mesaj zorunlu" }, { status: 400 });
    }

    // Individual notification to a specific user
    if (userId) {
      const [targetUser] = await db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!targetUser) {
        return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
      }

      await db.insert(notifications).values({
        userId,
        type: "admin_announcement" as const,
        title,
        message,
        channel: "in_app" as const,
      });

      // Send email notification
      sendNotificationEmail(targetUser.email, targetUser.name, "admin_announcement", title, message);

      return NextResponse.json({ message: "Bildirim gönderildi", count: 1 }, { status: 201 });
    }

    // Bulk notification to all users
    const allUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(ne(users.id, session.user.id));

    if (allUsers.length > 0) {
      await db.insert(notifications).values(
        allUsers.map((u) => ({
          userId: u.id,
          type: "admin_announcement" as const,
          title,
          message,
          channel: "in_app" as const,
        }))
      );
    }

    return NextResponse.json({ message: "Duyuru gönderildi", count: allUsers.length }, { status: 201 });
  } catch (error) {
    console.error("Send announcement error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
