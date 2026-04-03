import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dataDeletionRequests } from "@/db/schema/consents";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { notifications, pushSubscriptions } from "@/db/schema/notifications";
import { userBadges } from "@/db/schema/badges";
import { dancerRatings } from "@/db/schema/seasons";
import { battles, battleScores, battleStudioPreferences } from "@/db/schema/battles";

// GET /api/admin/deletion-requests — List all deletion requests
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const requests = await db
      .select({
        id: dataDeletionRequests.id,
        userId: dataDeletionRequests.userId,
        reason: dataDeletionRequests.reason,
        status: dataDeletionRequests.status,
        requestedAt: dataDeletionRequests.requestedAt,
        processedAt: dataDeletionRequests.processedAt,
        userName: users.name,
        userSurname: users.surname,
        userUsername: users.username,
        userEmail: users.email,
      })
      .from(dataDeletionRequests)
      .leftJoin(users, eq(dataDeletionRequests.userId, users.id))
      .orderBy(dataDeletionRequests.requestedAt);

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Get deletion requests error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/admin/deletion-requests — Approve or reject a deletion request
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { requestId, action } = (await req.json()) as { requestId: string; action: "approve" | "reject" };

    if (!requestId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Geçersiz parametreler" }, { status: 400 });
    }

    const [request] = await db
      .select()
      .from(dataDeletionRequests)
      .where(eq(dataDeletionRequests.id, requestId))
      .limit(1);

    if (!request) {
      return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
    }

    if (request.status !== "pending") {
      return NextResponse.json({ error: "Bu talep zaten işlenmiş" }, { status: 400 });
    }

    if (action === "reject") {
      await db
        .update(dataDeletionRequests)
        .set({
          status: "rejected",
          processedAt: new Date(),
          processedBy: session.user.id,
        })
        .where(eq(dataDeletionRequests.id, requestId));

      return NextResponse.json({ message: "Talep reddedildi" });
    }

    // Approve: delete user and all related data
    const userId = request.userId;

    // Mark request as approved first
    await db
      .update(dataDeletionRequests)
      .set({
        status: "approved",
        processedAt: new Date(),
        processedBy: session.user.id,
      })
      .where(eq(dataDeletionRequests.id, requestId));

    // Cascade delete user data (same logic as admin DELETE)
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    await db.delete(userBadges).where(eq(userBadges.userId, userId));
    await db.delete(dancerRatings).where(eq(dancerRatings.userId, userId));

    await db.delete(battleScores).where(eq(battleScores.judgeId, userId));
    await db.delete(battleScores).where(eq(battleScores.dancerId, userId));
    await db.delete(battleStudioPreferences).where(eq(battleStudioPreferences.userId, userId));

    const userBattles = await db
      .select({ id: battles.id })
      .from(battles)
      .where(sql`${battles.challengerId} = ${userId} OR ${battles.opponentId} = ${userId}`);

    if (userBattles.length > 0) {
      for (const bid of userBattles) {
        await db.delete(battleScores).where(eq(battleScores.battleId, bid.id));
        await db.delete(battleStudioPreferences).where(eq(battleStudioPreferences.battleId, bid.id));
      }
    }

    await db.update(battles).set({ judgeId: null }).where(eq(battles.judgeId, userId));
    await db.update(battles).set({ winnerId: null }).where(eq(battles.winnerId, userId));
    await db.execute(sql`DELETE FROM battles WHERE challenger_id = ${userId} OR opponent_id = ${userId}`);

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

    const userStudios = await db.execute(sql`SELECT id FROM studios WHERE owner_id = ${userId}`);
    if (userStudios.rows && userStudios.rows.length > 0) {
      for (const s of userStudios.rows) {
        const sid = (s as any).id;
        await db.execute(sql`DELETE FROM studio_availability WHERE studio_id = ${sid}`);
        await db.execute(sql`DELETE FROM battle_studio_preferences WHERE studio_id = ${sid}`);
        await db.execute(sql`UPDATE battles SET studio_id = NULL WHERE studio_id = ${sid}`);
      }
    }
    await db.execute(sql`DELETE FROM studios WHERE owner_id = ${userId}`);

    await db.execute(sql`DELETE FROM user_consents WHERE user_id = ${userId}`);
    await db.execute(sql`DELETE FROM data_deletion_requests WHERE user_id = ${userId}`);
    await db.execute(sql`UPDATE data_deletion_requests SET processed_by = NULL WHERE processed_by = ${userId}`);

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ message: "Talep onaylandı, kullanıcı verileri silindi" });
  } catch (error) {
    console.error("Process deletion request error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
