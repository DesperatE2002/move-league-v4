import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

// POST /api/auth/verify-email — Verify email with token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token gerekli" }, { status: 400 });
    }

    // Hash the incoming token and find user with matching resetToken
    const hashedToken = createHash("sha256").update(token).digest("hex");

    const result = await db
      .select({ id: users.id, emailVerified: users.emailVerified, resetToken: users.resetToken })
      .from(users)
      .where(eq(users.resetToken, hashedToken))
      .limit(1);

    if (!result[0]) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş token" }, { status: 400 });
    }

    if (result[0].emailVerified) {
      return NextResponse.json({ message: "E-posta zaten doğrulanmış" });
    }

    await db
      .update(users)
      .set({ emailVerified: true, resetToken: null, resetTokenExpiry: null })
      .where(eq(users.id, result[0].id));

    return NextResponse.json({ message: "E-posta doğrulandı" });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
