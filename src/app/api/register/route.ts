import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { userConsents } from "@/db/schema/consents";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { registerSchema } from "@/lib/validators";
import { sendWelcomeEmail } from "@/lib/email";
import { randomBytes, createHash } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Geçersiz veri";
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      );
    }

    const { name, surname, username, email, password, role, danceStyles, kvkkConsent, termsConsent, marketingConsent } = parsed.data;

    // Check if email already exists
    const existingEmail = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kullanılıyor" },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUsername = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUsername.length > 0) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı zaten kullanılıyor" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 12);

    // Generate verification token
    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const now = new Date();
    const newUser = await db
      .insert(users)
      .values({
        name,
        surname,
        username,
        email,
        passwordHash,
        role,
        danceStyle: danceStyles?.join(", ") || null,
        kvkkConsent: true,
        termsConsent: true,
        marketingConsent: marketingConsent || false,
        consentAt: now,
        resetToken: hashedToken,
        resetTokenExpiry: tokenExpiry,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        username: users.username,
        role: users.role,
      });

    // Log consent records (KVKK ispat kaydı)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const userId = newUser[0].id;

    await db.insert(userConsents).values([
      { userId, consentType: "kvkk" as const, action: "granted" as const, version: "1.0", ipAddress: ip, userAgent: ua },
      { userId, consentType: "terms" as const, action: "granted" as const, version: "1.0", ipAddress: ip, userAgent: ua },
      { userId, consentType: "privacy" as const, action: "granted" as const, version: "1.0", ipAddress: ip, userAgent: ua },
      ...(marketingConsent ? [{ userId, consentType: "marketing" as const, action: "granted" as const, version: "1.0", ipAddress: ip, userAgent: ua }] : []),
    ]);

    // Send welcome + verification email
    sendWelcomeEmail(email, name, rawToken);

    return NextResponse.json(
      { message: "Kayıt başarılı", user: newUser[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
