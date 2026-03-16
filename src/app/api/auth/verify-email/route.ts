import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";

// POST /api/auth/verify-email — Verify email with token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token gerekli" }, { status: 400 });
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

    if (result[0].emailVerified) {
      return NextResponse.json({ message: "E-posta zaten doğrulanmış" });
    }

    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, token));

    return NextResponse.json({ message: "E-posta doğrulandı" });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
