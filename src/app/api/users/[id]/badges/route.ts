import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userBadges } from "@/db/schema/badges";
import { badges } from "@/db/schema/badges";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/users/[id]/badges — Get user badges
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;

    const result = await db
      .select({
        id: userBadges.id,
        badgeId: userBadges.badgeId,
        earnedAt: userBadges.earnedAt,
        key: badges.key,
        nameTr: badges.nameTr,
        nameEn: badges.nameEn,
        descriptionTr: badges.descriptionTr,
        descriptionEn: badges.descriptionEn,
        iconUrl: badges.iconUrl,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, id));

    return NextResponse.json({ badges: result });
  } catch (error) {
    console.error("Get user badges error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/users/[id]/badges — Admin assigns a badge to user
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }
    const { id: userId } = await ctx.params;
    const { badgeId } = (await req.json()) as { badgeId: string };
    if (!badgeId) {
      return NextResponse.json({ error: "Badge ID gerekli" }, { status: 400 });
    }
    // Check if already assigned
    const existing = await db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Rozet zaten verilmiş" }, { status: 400 });
    }
    // Get badge info for notification
    const badgeInfo = await db.select().from(badges).where(eq(badges.id, badgeId)).limit(1);
    if (!badgeInfo[0]) {
      return NextResponse.json({ error: "Rozet bulunamadı" }, { status: 404 });
    }
    await db.insert(userBadges).values({ userId, badgeId });
    await createNotification(
      userId,
      "badge_earned",
      "Yeni Rozet Kazandınız!",
      `${badgeInfo[0].nameTr} rozetini kazandınız! Tebrikler!`,
      { badgeId }
    );
    return NextResponse.json({ message: "Rozet verildi" }, { status: 201 });
  } catch (error) {
    console.error("Assign badge error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
