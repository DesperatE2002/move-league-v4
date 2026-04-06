import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, bannedEmails } from "@/db/schema/users";
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
        bannedEmail: bannedEmails.email,
      })
      .from(users)
      .leftJoin(bannedEmails, eq(users.email, bannedEmails.email))
      .orderBy(users.createdAt);

    const result = allUsers.map((u) => ({
      ...u,
      isBanned: !!u.bannedEmail,
      bannedEmail: undefined,
    }));

    return NextResponse.json({ users: result });
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
      .select({ id: users.id, email: users.email, isActive: users.isActive })
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

      // Add email to banned list to prevent re-registration via Google
      await db.insert(bannedEmails).values({
        email: targetUser.email,
        reason: "Admin tarafından yasaklandı",
      }).onConflictDoNothing();

      return NextResponse.json({ message: "Kullanıcı yasaklandı" });
    }

    if (action === "unban") {
      await db
        .update(users)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(users.id, userId));

      // Remove email from banned list
      await db.delete(bannedEmails).where(eq(bannedEmails.email, targetUser.email));

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

    // Delete all related records — must respect FK dependency order

    // 1. Notifications & push subscriptions (no children)
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    await db.delete(userBadges).where(eq(userBadges.userId, userId));
    await db.delete(dancerRatings).where(eq(dancerRatings.userId, userId));

    // 2. Battle scores & preferences where user is judge/dancer/participant
    await db.delete(battleScores).where(eq(battleScores.judgeId, userId));
    await db.delete(battleScores).where(eq(battleScores.dancerId, userId));
    await db.delete(battleStudioPreferences).where(eq(battleStudioPreferences.userId, userId));

    // 3. Before deleting battles, delete their child records (scores/preferences for those battles)
    const userBattles = await db
      .select({ id: battles.id })
      .from(battles)
      .where(sql`${battles.challengerId} = ${userId} OR ${battles.opponentId} = ${userId}`);
    
    if (userBattles.length > 0) {
      const battleIds = userBattles.map(b => b.id);
      for (const bid of battleIds) {
        await db.delete(battleScores).where(eq(battleScores.battleId, bid));
        await db.delete(battleStudioPreferences).where(eq(battleStudioPreferences.battleId, bid));
      }
    }

    // Nullify user references in other battles (preserve battle history)
    await db.update(battles).set({ judgeId: null }).where(eq(battles.judgeId, userId));
    await db.update(battles).set({ winnerId: null }).where(eq(battles.winnerId, userId));

    // Delete battles where user is challenger or opponent
    await db.execute(sql`DELETE FROM battles WHERE challenger_id = ${userId} OR opponent_id = ${userId}`);

    // 4. Workshop sub-records first, then workshops
    // Get user's workshops to delete their enrollments/reviews/messages
    const userWorkshops = await db.execute(sql`SELECT id FROM workshops WHERE coach_id = ${userId}`);
    if (userWorkshops.rows && userWorkshops.rows.length > 0) {
      for (const w of userWorkshops.rows) {
        const wid = (w as any).id;
        await db.execute(sql`DELETE FROM workshop_messages WHERE workshop_id = ${wid}`);
        await db.execute(sql`DELETE FROM workshop_reviews WHERE workshop_id = ${wid}`);
        await db.execute(sql`DELETE FROM workshop_enrollments WHERE workshop_id = ${wid}`);
      }
    }
    await db.execute(sql`DELETE FROM workshop_messages WHERE sender_id = ${userId} OR receiver_id = ${userId}`);
    await db.execute(sql`DELETE FROM workshop_reviews WHERE user_id = ${userId}`);
    await db.execute(sql`DELETE FROM workshop_enrollments WHERE user_id = ${userId}`);
    await db.execute(sql`DELETE FROM workshops WHERE coach_id = ${userId}`);

    // 5. Team sub-records first, then teams
    const userTeams = await db.execute(sql`SELECT id FROM teams WHERE coach_id = ${userId}`);
    if (userTeams.rows && userTeams.rows.length > 0) {
      for (const tm of userTeams.rows) {
        const tid = (tm as any).id;
        await db.execute(sql`DELETE FROM competition_results WHERE team_id = ${tid}`);
        await db.execute(sql`DELETE FROM competition_registrations WHERE team_id = ${tid}`);
        await db.execute(sql`DELETE FROM team_members WHERE team_id = ${tid}`);
      }
    }
    await db.execute(sql`DELETE FROM team_members WHERE user_id = ${userId}`);
    await db.execute(sql`DELETE FROM teams WHERE coach_id = ${userId}`);

    // 6. Studio sub-records first, then studios
    const userStudios = await db.execute(sql`SELECT id FROM studios WHERE owner_id = ${userId}`);
    if (userStudios.rows && userStudios.rows.length > 0) {
      for (const s of userStudios.rows) {
        const sid = (s as any).id;
        await db.execute(sql`DELETE FROM studio_availability WHERE studio_id = ${sid}`);
        await db.execute(sql`DELETE FROM battle_studio_preferences WHERE studio_id = ${sid}`);
        // Nullify studioId in battles referencing this studio
        await db.execute(sql`UPDATE battles SET studio_id = NULL WHERE studio_id = ${sid}`);
      }
    }
    await db.execute(sql`DELETE FROM studios WHERE owner_id = ${userId}`);

    // 7. Consents & deletion requests
    await db.execute(sql`DELETE FROM user_consents WHERE user_id = ${userId}`);
    await db.execute(sql`DELETE FROM data_deletion_requests WHERE user_id = ${userId}`);
    await db.execute(sql`UPDATE data_deletion_requests SET processed_by = NULL WHERE processed_by = ${userId}`);

    // 8. Finally delete the user
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ message: `${targetUser.username} silindi` });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Kullanıcı silinemedi: " + (error instanceof Error ? error.message : "Sunucu hatası") }, { status: 500 });
  }
}
