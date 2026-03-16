import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema/notifications";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/notifications/[id] — Okundu işaretle
export async function PATCH(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, session.user.id)
        )
      );

    return NextResponse.json({ message: "Bildirim okundu" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
