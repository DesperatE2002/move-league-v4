import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { notifications } from "@/db/schema/notifications";
import { auth } from "@/lib/auth";
import { ne } from "drizzle-orm";

// POST /api/admin/announcements — Send announcement to all users
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await req.json();
    const { title, message } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Başlık ve mesaj zorunlu" }, { status: 400 });
    }

    // Get all active user IDs
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
