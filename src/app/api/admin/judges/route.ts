import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const judgeList = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        username: users.username,
      })
      .from(users)
      .where(eq(users.role, "judge"));

    // Also include admins as potential judges
    const adminList = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        username: users.username,
      })
      .from(users)
      .where(eq(users.role, "admin"));

    return NextResponse.json({
      judges: [...judgeList, ...adminList],
    });
  } catch (error) {
    console.error("Get judges error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
