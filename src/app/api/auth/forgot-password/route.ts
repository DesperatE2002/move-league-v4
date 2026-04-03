import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomBytes, createHash } from "crypto";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/auth/forgot-password — Request password reset
export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 3 reset requests per IP per hour
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const { limited } = rateLimit(`forgot:${ip}`, 3, 60 * 60 * 1000);
    if (limited) {
      return NextResponse.json(
        { error: "Çok fazla talep. Lütfen daha sonra tekrar deneyin." },
        { status: 429 }
      );
    }
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
    }

    // Check if user exists (don't reveal if user doesn't exist for security)
    const result = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to prevent email enumeration
    if (result[0]) {
      // Generate secure token
      const rawToken = randomBytes(32).toString("hex");
      const hashedToken = createHash("sha256").update(rawToken).digest("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db
        .update(users)
        .set({ resetToken: hashedToken, resetTokenExpiry: expiry })
        .where(eq(users.id, result[0].id));

      sendPasswordResetEmail(email, result[0].name || "", rawToken);
    }

    return NextResponse.json({
      message: "Şifre sıfırlama bağlantısı varsa e-posta adresinize gönderildi",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
