import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/users/[id] — View user profile
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        username: users.username,
        role: users.role,
        avatarUrl: users.avatarUrl,
        city: users.city,
        country: users.country,
        gender: users.gender,
        danceStyle: users.danceStyle,
        bio: users.bio,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!result[0]) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
