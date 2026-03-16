import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema/notifications";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// POST /api/notifications/subscribe-push — Subscribe to push notifications
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, p256dh, auth: authKey } = body;

    if (!endpoint || !p256dh || !authKey) {
      return NextResponse.json({ error: "Geçersiz abonelik verisi" }, { status: 400 });
    }

    // Check if already subscribed with same endpoint
    const existing = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, session.user.id),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      )
      .limit(1);

    if (existing[0]) {
      // Update existing
      await db
        .update(pushSubscriptions)
        .set({ p256dh, auth: authKey })
        .where(eq(pushSubscriptions.id, existing[0].id));
    } else {
      await db.insert(pushSubscriptions).values({
        userId: session.user.id,
        endpoint,
        p256dh,
        auth: authKey,
      });
    }

    return NextResponse.json({ message: "Push aboneliği kaydedildi" });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/notifications/subscribe-push — Unsubscribe from push
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint gerekli" }, { status: 400 });
    }

    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, session.user.id),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );

    return NextResponse.json({ message: "Push aboneliği iptal edildi" });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
