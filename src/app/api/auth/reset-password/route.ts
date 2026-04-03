import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { createHash } from "crypto";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/auth/reset-password — Reset password with token
export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 5 reset attempts per IP per 15 minutes
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const { limited } = rateLimit(`reset:${ip}`, 5, 15 * 60 * 1000);
    if (limited) {
      return NextResponse.json(
        { error: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin." },
        { status: 429 }
      );
    }
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: "Token ve şifre gerekli" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Şifre en az 8 karakter olmalıdır" }, { status: 400 });
    }

    // Hash the incoming token and compare with stored hash
    const hashedToken = createHash("sha256").update(token).digest("hex");

    const result = await db
      .select({ id: users.id, resetToken: users.resetToken, resetTokenExpiry: users.resetTokenExpiry })
      .from(users)
      .where(eq(users.resetToken, hashedToken))
      .limit(1);

    if (!result[0]) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş token" }, { status: 400 });
    }

    // Check token expiry
    if (result[0].resetTokenExpiry && result[0].resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: "Token süresi dolmuş, yeni bir talep oluşturun" }, { status: 400 });
    }

    const passwordHash = await bcryptjs.hash(password, 12);

    await db
      .update(users)
      .set({ passwordHash, resetToken: null, resetTokenExpiry: null, updatedAt: new Date() })
      .where(eq(users.id, result[0].id));

    return NextResponse.json({ message: "Şifre başarıyla değiştirildi" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
