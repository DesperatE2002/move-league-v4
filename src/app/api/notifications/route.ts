import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema/notifications";
import { auth } from "@/lib/auth";
import { eq, desc, and } from "drizzle-orm";

// GET /api/notifications — Bildirimleri listele
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    const unreadCount = result.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications: result, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/notifications — Tümünü okundu yap
export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.isRead, false)
        )
      );

    return NextResponse.json({ message: "Tüm bildirimler okundu" });
  } catch (error) {
    console.error("Mark all read error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
