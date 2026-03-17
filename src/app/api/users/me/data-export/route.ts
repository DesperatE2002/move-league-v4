import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { userConsents } from "@/db/schema/consents";
import { userBadges, badges } from "@/db/schema/badges";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/users/me/data-export — KVKK Article 11: User data export
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const userId = session.user.id;

    // User profile
    const [profile] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        surname: users.surname,
        username: users.username,
        role: users.role,
        city: users.city,
        country: users.country,
        gender: users.gender,
        danceStyle: users.danceStyle,
        bio: users.bio,
        language: users.language,
        kvkkConsent: users.kvkkConsent,
        termsConsent: users.termsConsent,
        marketingConsent: users.marketingConsent,
        consentAt: users.consentAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Consent history
    const consents = await db
      .select()
      .from(userConsents)
      .where(eq(userConsents.userId, userId));

    // Badges
    const myBadges = await db
      .select({
        badgeKey: badges.key,
        badgeNameTr: badges.nameTr,
        badgeNameEn: badges.nameEn,
        earnedAt: userBadges.earnedAt,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId));

    const exportData = {
      exportDate: new Date().toISOString(),
      exportReason: "KVKK Madde 11 - Kişisel verilere erişim hakkı",
      profile: {
        ...profile,
        passwordHash: "[REDACTED]",
      },
      consentHistory: consents.map((c) => ({
        type: c.consentType,
        action: c.action,
        version: c.version,
        ipAddress: c.ipAddress,
        date: c.createdAt,
      })),
      badges: myBadges,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="move-league-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
