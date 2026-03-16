import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { and, ne, eq, or, ilike } from "drizzle-orm";

// GET /api/users/search?q=query — Dansçı ara (düello rakibi seçmek için)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const pattern = `%${q}%`;

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        username: users.username,
        avatarUrl: users.avatarUrl,
        danceStyle: users.danceStyle,
        city: users.city,
        country: users.country,
      })
      .from(users)
      .where(
        and(
          ne(users.id, session.user.id),
          eq(users.isActive, true),
          or(
            ilike(users.username, pattern),
            ilike(users.name, pattern),
            ilike(users.surname, pattern)
          )
        )
      )
      .limit(20);

    return NextResponse.json({ users: result });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
