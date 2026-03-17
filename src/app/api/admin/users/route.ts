import { NextRequest, NextResponse } from "next/server";
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

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        username: users.username,
        email: users.email,
        role: users.role,
        city: users.city,
        country: users.country,
        isActive: users.isActive,
        kvkkConsent: users.kvkkConsent,
        termsConsent: users.termsConsent,
        marketingConsent: users.marketingConsent,
        consentAt: users.consentAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role } = body as { userId: string; role: string };

    if (!userId || !role) {
      return NextResponse.json({ error: "Geçersiz parametreler" }, { status: 400 });
    }

    const validRoles = ["dancer", "coach", "studio", "judge", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
    }

    // Prevent self-demotion
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Kendi rolünüzü değiştiremezsiniz" }, { status: 400 });
    }

    await db
      .update(users)
      .set({ role: role as "dancer" | "coach" | "studio" | "judge" | "admin", updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ message: "Rol güncellendi" });
  } catch (error) {
    console.error("Update user role error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
