import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";

// POST /api/auth/forgot-password — Request password reset
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
    }

    // Check if user exists (don't reveal if user doesn't exist for security)
    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to prevent email enumeration
    // In production: send email with reset token via Resend
    if (result[0]) {
      // TODO: Send email with reset link containing user ID as token
      // await sendResetEmail(email, result[0].id);
      console.log("Password reset requested for:", email);
    }

    return NextResponse.json({
      message: "Şifre sıfırlama bağlantısı varsa e-posta adresinize gönderildi",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
