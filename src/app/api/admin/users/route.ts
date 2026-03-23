import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, and, ne, sql } from "drizzle-orm";
import { notifications, pushSubscriptions } from "@/db/schema/notifications";
import { userBadges } from "@/db/schema/badges";
import { dancerRatings } from "@/db/schema/seasons";
import { battles, battleScores, battleStudioPreferences } from "@/db/schema/battles";

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
    const { userId, role, action } = body as { userId: string; role?: string; action?: string };

    if (!userId) {
      return NextResponse.json({ error: "Geçersiz parametreler" }, { status: 400 });
    }

    // Prevent acting on self
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Kendiniz üzerinde bu işlemi yapamazsınız" }, { status: 400 });
    }

    // Check user exists
    const [targetUser] = await db
      .select({ id: users.id, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Ban / Unban actions
    if (action === "ban") {
      await db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, userId));
      return NextResponse.json({ message: "Kullanıcı yasaklandı" });
    }

    if (action === "unban") {
      await db
        .update(users)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(users.id, userId));
      return NextResponse.json({ message: "Kullanıcı yasağı kaldırıldı" });
    }

    // Role change
    if (role) {
      const validRoles = ["dancer", "coach", "studio", "judge", "admin"];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
      }

      await db
        .update(users)
        .set({ role: role as "dancer" | "coach" | "studio" | "judge" | "admin", updatedAt: new Date() })
        .where(eq(users.id, userId));

      return NextResponse.json({ message: "Rol güncellendi" });
    }

    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID gerekli" }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: "Kendinizi silemezsiniz" }, { status: 400 });
    }

    const [targetUser] = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Delete all related records in order (foreign key dependencies)
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    await db.delete(userBadges).where(eq(userBadges.userId, userId));
    await db.delete(dancerRatings).where(eq(dancerRatings.userId, userId));
    await db.delete(battleScores).where(eq(battleScores.judgeId, userId));
    await db.delete(battleScores).where(eq(battleScores.dancerId, userId));
    await db.delete(battleStudioPreferences).where(eq(battleStudioPreferences.userId, userId));

    // Nullify user references in battles (don't delete battles, preserve history)
    await db.update(battles).set({ judgeId: null }).where(eq(battles.judgeId, userId));
    await db.update(battles).set({ winnerId: null }).where(eq(battles.winnerId, userId));
    // Delete battles where user is challenger or opponent
    await db.delete(battles).where(eq(battles.challengerId, userId));
    await db.delete(battles).where(eq(battles.opponentId, userId));

    // Delete related workshop/team data via raw SQL for tables with userId
    await db.execute(sql`DELETE FROM workshop_messages WHERE sender_id = ${userId} OR receiver_id = ${userId}`);
    await db.execute(sql`DELETE FROM workshop_reviews WHERE user_id = ${userId}`);
    await db.execute(sql`DELETE FROM workshop_enrollments WHERE user_id = ${userId}`);
    await db.execute(sql`DELETE FROM workshops WHERE coach_id = ${userId}`);
    await db.execute(sql`DELETE FROM team_members WHERE user_id = ${userId}`);
    await db.execute(sql`DELETE FROM teams WHERE coach_id = ${userId}`);
    await db.execute(sql`DELETE FROM studios WHERE owner_id = ${userId}`);
    await db.execute(sql`DELETE FROM user_consents WHERE user_id = ${userId}`);
    await db.execute(sql`DELETE FROM data_deletion_requests WHERE user_id = ${userId}`);

    // Finally delete the user
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ message: `${targetUser.username} silindi` });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Kullanıcı silinemedi: " + (error instanceof Error ? error.message : "Sunucu hatası") }, { status: 500 });
  }
}
