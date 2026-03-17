import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { userConsents, dataDeletionRequests } from "@/db/schema/consents";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// GET /api/users/me/consents — Get current user's consent history
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const [user] = await db
      .select({
        kvkkConsent: users.kvkkConsent,
        termsConsent: users.termsConsent,
        marketingConsent: users.marketingConsent,
        consentAt: users.consentAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const history = await db
      .select()
      .from(userConsents)
      .where(eq(userConsents.userId, session.user.id))
      .orderBy(desc(userConsents.createdAt));

    return NextResponse.json({
      current: user,
      history: history.map((h) => ({
        id: h.id,
        type: h.consentType,
        action: h.action,
        version: h.version,
        date: h.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get consents error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/users/me/consents — Update marketing consent (withdraw or grant)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { marketingConsent } = (await req.json()) as { marketingConsent: boolean };
    if (typeof marketingConsent !== "boolean") {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ua = req.headers.get("user-agent") || "unknown";

    // Update user record
    await db
      .update(users)
      .set({ marketingConsent, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    // Log consent action
    await db.insert(userConsents).values({
      userId: session.user.id,
      consentType: "marketing",
      action: marketingConsent ? "granted" : "withdrawn",
      version: "1.0",
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json({ message: "Güncellendi", marketingConsent });
  } catch (error) {
    console.error("Update consent error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
