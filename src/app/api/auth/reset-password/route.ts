import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";

// POST /api/auth/reset-password — Reset password with token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: "Token ve şifre gerekli" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Şifre en az 8 karakter olmalıdır" }, { status: 400 });
    }

    // Token is the user ID for simplicity (in production, use a proper token system)
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, token))
      .limit(1);

    if (!result[0]) {
      return NextResponse.json({ error: "Geçersiz token" }, { status: 400 });
    }

    const passwordHash = await bcryptjs.hash(password, 12);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, token));

    return NextResponse.json({ message: "Şifre başarıyla değiştirildi" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
