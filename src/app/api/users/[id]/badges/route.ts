import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userBadges } from "@/db/schema/badges";
import { badges } from "@/db/schema/badges";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

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
