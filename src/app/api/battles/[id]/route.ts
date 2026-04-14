import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { battles, battleStudioPreferences } from "@/db/schema/battles";
import { battleScores } from "@/db/schema/battles";
import { users } from "@/db/schema/users";
import { studios } from "@/db/schema/users";
import { dancerRatings } from "@/db/schema/seasons";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { calculateElo } from "@/lib/elo";
import { battleScoreSchema } from "@/lib/validators";
import { eq, and, sql } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/battles/[id] — Düello detayı
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;

    const result = await db
      .select()
      .from(battles)
      .where(eq(battles.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Düello bulunamadı" }, { status: 404 });
    }

    const battle = result[0];

    // Get participant info
    const [challengerArr, opponentArr] = await Promise.all([
      db
        .select({
          id: users.id, name: users.name, surname: users.surname,
          username: users.username, avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, battle.challengerId))
        .limit(1),
      db
        .select({
          id: users.id, name: users.name, surname: users.surname,
          username: users.username, avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, battle.opponentId))
        .limit(1),
    ]);

    // Get scores if completed
    const scores = await db
      .select()
      .from(battleScores)
      .where(eq(battleScores.battleId, id));

    // Get studio preferences
    const studioPrefs = await db
      .select()
      .from(battleStudioPreferences)
      .where(eq(battleStudioPreferences.battleId, id));

    // Get assigned studio info if exists
    let studioInfo = null;
    let studioOwnerId: string | null = null;
    if (battle.studioId) {
      const studioArr = await db
        .select({ id: studios.id, name: studios.name, city: studios.city, address: studios.address, ownerId: studios.ownerId })
        .from(studios)
        .where(eq(studios.id, battle.studioId))
        .limit(1);
      if (studioArr[0]) {
        studioOwnerId = studioArr[0].ownerId;
        studioInfo = { id: studioArr[0].id, name: studioArr[0].name, city: studioArr[0].city, address: studioArr[0].address };
      }
    }

    return NextResponse.json({
      ...battle,
      challenger: challengerArr[0] ?? null,
      opponent: opponentArr[0] ?? null,
      scores,
      studioPreferences: studioPrefs,
      studio: studioInfo,
      studioOwnerId,
    });
  } catch (error) {
    console.error("Get battle error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/battles/[id] — Düello durumunu güncelle
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const { action } = body as { action: string };

    const result = await db.select().from(battles).where(eq(battles.id, id)).limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Düello bulunamadı" }, { status: 404 });
    }

    const battle = result[0];
    const userId = session.user.id;
    const role = session.user.role;

    switch (action) {
      case "accept": {
        if (battle.opponentId !== userId) {
          return NextResponse.json({ error: "Bu düelloyu sadece rakip kabul edebilir" }, { status: 403 });
        }
        if (battle.status !== "pending") {
          return NextResponse.json({ error: "Bu düello zaten işlenmiş" }, { status: 400 });
        }

        await db
          .update(battles)
          .set({ status: "studio_pending", updatedAt: new Date() })
          .where(eq(battles.id, id));

        // Notify both dancers to select studios
        await Promise.all([
          createNotification(
            battle.challengerId,
            "battle_accepted",
            "Düello Kabul Edildi!",
            `${session.user.name} düello talebinizi kabul etti! Şimdi stüdyo tercihlerinizi seçin.`,
            { battleId: id }
          ),
          createNotification(
            battle.opponentId,
            "battle_accepted",
            "Stüdyo Seçimi",
            "Düello kabul edildi! Şimdi stüdyo tercihlerinizi seçin.",
            { battleId: id }
          ),
        ]);

        return NextResponse.json({ message: "Düello kabul edildi, stüdyo seçimi bekleniyor", status: "studio_pending" });
      }

      case "select-studios": {
        // Both challenger and opponent can select studios
        if (battle.challengerId !== userId && battle.opponentId !== userId) {
          return NextResponse.json({ error: "Bu düelloda stüdyo seçimi yapamazsınız" }, { status: 403 });
        }
        if (battle.status !== "studio_pending") {
          return NextResponse.json({ error: "Bu aşamada stüdyo seçimi yapılamaz" }, { status: 400 });
        }

        const { studioIds } = body as { studioIds: string[] };
        if (!studioIds || !Array.isArray(studioIds) || studioIds.length === 0 || studioIds.length > 4) {
          return NextResponse.json({ error: "1-4 arası stüdyo seçmelisiniz" }, { status: 400 });
        }

        // Remove old preferences for this user
        await db.delete(battleStudioPreferences).where(
          and(
            eq(battleStudioPreferences.battleId, id),
            eq(battleStudioPreferences.userId, userId)
          )
        );

        // Insert new preferences
        await db.insert(battleStudioPreferences).values(
          studioIds.map((sId, idx) => ({
            battleId: id,
            userId,
            studioId: sId,
            rank: idx + 1,
          }))
        );

        // Check if both users have selected
        const allPrefs = await db
          .select()
          .from(battleStudioPreferences)
          .where(eq(battleStudioPreferences.battleId, id));

        const challengerPrefs = allPrefs.filter((p) => p.userId === battle.challengerId);
        const opponentPrefs = allPrefs.filter((p) => p.userId === battle.opponentId);

        if (challengerPrefs.length > 0 && opponentPrefs.length > 0) {
          // Both selected — find best matching studio
          const cStudioIds = challengerPrefs.sort((a, b) => a.rank - b.rank).map((p) => p.studioId);
          const oStudioIds = opponentPrefs.sort((a, b) => a.rank - b.rank).map((p) => p.studioId);

          let matchedStudioId: string | null = null;
          let bestScore = Infinity;

          // Find common studio with best combined rank
          for (let ci = 0; ci < cStudioIds.length; ci++) {
            const oi = oStudioIds.indexOf(cStudioIds[ci]);
            if (oi !== -1) {
              const score = ci + oi; // lower = better
              if (score < bestScore) {
                bestScore = score;
                matchedStudioId = cStudioIds[ci];
              }
            }
          }

          // If no common studio, pick challenger's #1
          if (!matchedStudioId) {
            matchedStudioId = cStudioIds[0];
          }

          // Update battle with matched studio — keep studio_pending for owner approval
          await db
            .update(battles)
            .set({ studioId: matchedStudioId, updatedAt: new Date() })
            .where(eq(battles.id, id));

          // Get studio name + owner for notification
          const studioRow = await db
            .select({ name: studios.name, ownerId: studios.ownerId })
            .from(studios)
            .where(eq(studios.id, matchedStudioId))
            .limit(1);

          const studioName = studioRow[0]?.name || "Stüdyo";
          const studioOwnerId = studioRow[0]?.ownerId;

          // Notify studio owner to approve
          if (studioOwnerId) {
            await createNotification(
              studioOwnerId,
              "battle_scheduled",
              "Düello Stüdyo Talebi!",
              `Stüdyonuz (${studioName}) bir düello için seçildi. Onaylayıp tarih ve detay belirtebilirsiniz.`,
              { battleId: id }
            );
          }

          // Notify dancers that studio is matched, waiting for studio approval
          await Promise.all([
            createNotification(
              battle.challengerId,
              "battle_scheduled",
              "Stüdyo Belirlendi!",
              `Düellonuz için ${studioName} stüdyosu eşleştirildi. Stüdyo onayı bekleniyor.`,
              { battleId: id }
            ),
            createNotification(
              battle.opponentId,
              "battle_scheduled",
              "Stüdyo Belirlendi!",
              `Düellonuz için ${studioName} stüdyosu eşleştirildi. Stüdyo onayı bekleniyor.`,
              { battleId: id }
            ),
          ]);

          return NextResponse.json({ message: "Stüdyo eşleştirildi! Stüdyo onayı bekleniyor.", status: "studio_pending", studioId: matchedStudioId });
        }

        return NextResponse.json({ message: "Stüdyo tercihleri kaydedildi. Diğer dansçının seçimi bekleniyor." });
      }

      case "decline": {
        if (battle.opponentId !== userId) {
          return NextResponse.json({ error: "Bu düelloyu sadece rakip reddedebilir" }, { status: 403 });
        }
        if (battle.status !== "pending") {
          return NextResponse.json({ error: "Bu düello zaten işlenmiş" }, { status: 400 });
        }

        await db
          .update(battles)
          .set({ status: "declined", updatedAt: new Date() })
          .where(eq(battles.id, id));

        await createNotification(
          battle.challengerId,
          "battle_declined",
          "Düello Reddedildi",
          `${session.user.name} düello talebinizi reddetti.`,
          { battleId: id }
        );

        return NextResponse.json({ message: "Düello reddedildi", status: "declined" });
      }

      case "cancel": {
        if (battle.challengerId !== userId) {
          return NextResponse.json({ error: "Sadece düelloyu başlatan iptal edebilir" }, { status: 403 });
        }
        if (!["pending", "accepted", "studio_pending"].includes(battle.status)) {
          return NextResponse.json({ error: "Bu aşamada iptal edilemez" }, { status: 400 });
        }

        await db
          .update(battles)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(battles.id, id));

        return NextResponse.json({ message: "Düello iptal edildi", status: "cancelled" });
      }

      case "studio-approve": {
        // Studio owner approves the battle
        if (role !== "studio" && role !== "admin") {
          return NextResponse.json({ error: "Sadece stüdyo sahibi onaylayabilir" }, { status: 403 });
        }
        if (battle.status !== "studio_pending" || !battle.studioId) {
          return NextResponse.json({ error: "Bu düello stüdyo onayı aşamasında değil" }, { status: 400 });
        }

        // Verify user owns the studio
        const approveStudio = await db
          .select({ ownerId: studios.ownerId, name: studios.name })
          .from(studios)
          .where(eq(studios.id, battle.studioId))
          .limit(1);

        if (!approveStudio[0] || (approveStudio[0].ownerId !== userId && role !== "admin")) {
          return NextResponse.json({ error: "Bu stüdyonun sahibi değilsiniz" }, { status: 403 });
        }

        const { scheduledDate: approveDate, studioNotes, studioLocation } = body as { scheduledDate?: string; studioNotes?: string; studioLocation?: string };

        const updateFields: Record<string, unknown> = {
          status: "studio_approved",
          updatedAt: new Date(),
        };
        if (approveDate) {
          updateFields.scheduledDate = new Date(approveDate);
        }

        await db.update(battles).set(updateFields).where(eq(battles.id, id));

        const stName = approveStudio[0].name;
        const dateStr = approveDate
          ? new Date(approveDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" })
          : "";
        const locationStr = studioLocation ? `\nYer: ${studioLocation}` : "";
        const notesStr = studioNotes ? `\nNot: ${studioNotes}` : "";
        const approveMsg = `${stName} stüdyosu düellonuzu onayladı!${dateStr ? ` Tarih: ${dateStr}` : ""}${locationStr}${notesStr}`;

        await Promise.all([
          createNotification(battle.challengerId, "battle_scheduled", "Stüdyo Onayladı!", approveMsg, { battleId: id }),
          createNotification(battle.opponentId, "battle_scheduled", "Stüdyo Onayladı!", approveMsg, { battleId: id }),
        ]);

        return NextResponse.json({ message: "Stüdyo onaylandı", status: "studio_approved" });
      }

      case "studio-reject": {
        // Studio owner rejects the battle
        if (role !== "studio" && role !== "admin") {
          return NextResponse.json({ error: "Sadece stüdyo sahibi reddedebilir" }, { status: 403 });
        }
        if (battle.status !== "studio_pending" || !battle.studioId) {
          return NextResponse.json({ error: "Bu düello stüdyo onayı aşamasında değil" }, { status: 400 });
        }

        // Verify user owns the studio
        const rejectStudio = await db
          .select({ ownerId: studios.ownerId, name: studios.name })
          .from(studios)
          .where(eq(studios.id, battle.studioId))
          .limit(1);

        if (!rejectStudio[0] || (rejectStudio[0].ownerId !== userId && role !== "admin")) {
          return NextResponse.json({ error: "Bu stüdyonun sahibi değilsiniz" }, { status: 403 });
        }

        const { studioNotes: rejectNotes } = body as { studioNotes?: string };

        await db
          .update(battles)
          .set({ status: "studio_rejected", updatedAt: new Date() })
          .where(eq(battles.id, id));

        const rName = rejectStudio[0].name;
        const rejectMsg = `${rName} stüdyosu düello talebini reddetti.${rejectNotes ? ` Sebep: ${rejectNotes}` : ""}`;

        await Promise.all([
          createNotification(battle.challengerId, "battle_declined", "Stüdyo Reddetti", rejectMsg, { battleId: id }),
          createNotification(battle.opponentId, "battle_declined", "Stüdyo Reddetti", rejectMsg, { battleId: id }),
        ]);

        return NextResponse.json({ message: "Stüdyo reddetti", status: "studio_rejected" });
      }

      case "studio-update": {
        // Studio owner updates an already-approved battle
        if (role !== "studio" && role !== "admin") {
          return NextResponse.json({ error: "Sadece stüdyo sahibi güncelleyebilir" }, { status: 403 });
        }
        if (!battle.studioId) {
          return NextResponse.json({ error: "Bu düelloya stüdyo atanmamış" }, { status: 400 });
        }
        if (!["studio_approved", "scheduled", "judge_assigned"].includes(battle.status)) {
          return NextResponse.json({ error: "Bu aşamada güncelleme yapılamaz" }, { status: 400 });
        }

        // Verify user owns the studio
        const updateStudio = await db
          .select({ ownerId: studios.ownerId, name: studios.name })
          .from(studios)
          .where(eq(studios.id, battle.studioId))
          .limit(1);

        if (!updateStudio[0] || (updateStudio[0].ownerId !== userId && role !== "admin")) {
          return NextResponse.json({ error: "Bu stüdyonun sahibi değilsiniz" }, { status: 403 });
        }

        const { scheduledDate: updateDate, studioNotes: updateNotes, studioLocation: updateLocation } = body as {
          scheduledDate?: string;
          studioNotes?: string;
          studioLocation?: string;
        };

        const studioUpdateFields: Record<string, unknown> = {
          updatedAt: new Date(),
        };
        if (updateDate) {
          studioUpdateFields.scheduledDate = new Date(updateDate);
        }

        await db.update(battles).set(studioUpdateFields).where(eq(battles.id, id));

        // Send notification to both dancers
        const uStName = updateStudio[0].name;
        const uDateStr = updateDate
          ? new Date(updateDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" })
          : "";
        const uLocationStr = updateLocation ? `\nYer: ${updateLocation}` : "";
        const uNotesStr = updateNotes ? `\nNot: ${updateNotes}` : "";
        const updateMsg = `${uStName} stüdyosu düello bilgilerini güncelledi.${uDateStr ? ` Yeni Tarih: ${uDateStr}` : ""}${uLocationStr}${uNotesStr}`;

        await Promise.all([
          createNotification(battle.challengerId, "battle_scheduled", "Düello Güncellendi!", updateMsg, { battleId: id }),
          createNotification(battle.opponentId, "battle_scheduled", "Düello Güncellendi!", updateMsg, { battleId: id }),
        ]);

        return NextResponse.json({ message: "Düello güncellendi", status: battle.status });
      }

      case "schedule": {
        if (role !== "admin") {
          return NextResponse.json({ error: "Sadece admin planlama yapabilir" }, { status: 403 });
        }
        const { scheduledDate, judgeId } = body as { scheduledDate: string; judgeId?: string };
        if (!scheduledDate) {
          return NextResponse.json({ error: "Tarih gerekli" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {
          scheduledDate: new Date(scheduledDate),
          status: judgeId ? "judge_assigned" : "scheduled",
          updatedAt: new Date(),
        };
        if (judgeId) updateData.judgeId = judgeId;

        await db.update(battles).set(updateData).where(eq(battles.id, id));

        // Notify both dancers
        const msg = `Düellonuz planlandı: ${new Date(scheduledDate).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}`;
        await Promise.all([
          createNotification(battle.challengerId, "battle_scheduled", "Düello Planlandı!", msg, { battleId: id }),
          createNotification(battle.opponentId, "battle_scheduled", "Düello Planlandı!", msg, { battleId: id }),
        ]);

        return NextResponse.json({ message: "Düello planlandı" });
      }

      case "assign-judge": {
        if (role !== "admin") {
          return NextResponse.json({ error: "Sadece admin hakem atayabilir" }, { status: 403 });
        }
        const { judgeId: jId } = body as { judgeId: string };
        if (!jId) {
          return NextResponse.json({ error: "Hakem ID gerekli" }, { status: 400 });
        }

        await db
          .update(battles)
          .set({ judgeId: jId, status: "judge_assigned", updatedAt: new Date() })
          .where(eq(battles.id, id));

        await createNotification(jId, "judge_assigned", "Hakem Ataması", "Size bir düello hakem ataması yapıldı.", { battleId: id });

        return NextResponse.json({ message: "Hakem atandı" });
      }

      default:
        return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
    }
  } catch (error) {
    console.error("Update battle error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/battles/[id] — Hakm puanlaması yap ve düelloyu tamamla
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = battleScoreSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Geçersiz puanlama" }, { status: 400 });
    }

    const result = await db.select().from(battles).where(eq(battles.id, id)).limit(1);
    if (result.length === 0) {
      return NextResponse.json({ error: "Düello bulunamadı" }, { status: 404 });
    }

    const battle = result[0];

    // Only assigned judge or admin can score
    if (session.user.role !== "admin" && battle.judgeId !== session.user.id) {
      return NextResponse.json({ error: "Puanlama yetkiniz yok" }, { status: 403 });
    }

    if (!["judge_assigned", "scheduled", "accepted", "studio_approved"].includes(battle.status)) {
      return NextResponse.json({ error: "Bu düello puanlanamaz" }, { status: 400 });
    }

    // Prevent duplicate scoring
    const existingScores = await db
      .select({ id: battleScores.id })
      .from(battleScores)
      .where(eq(battleScores.battleId, id))
      .limit(1);

    if (existingScores.length > 0) {
      return NextResponse.json({ error: "Bu düello zaten puanlanmış" }, { status: 400 });
    }

    const data = parsed.data;

    const challengerTotal =
      data.challengerTechnique + data.challengerCreativity +
      data.challengerMusicality + data.challengerStagePresence;

    const opponentTotal =
      data.opponentTechnique + data.opponentCreativity +
      data.opponentMusicality + data.opponentStagePresence;

    // Insert scores
    await db.insert(battleScores).values([
      {
        battleId: id,
        judgeId: session.user.id,
        dancerId: battle.challengerId,
        technique: data.challengerTechnique,
        creativity: data.challengerCreativity,
        musicality: data.challengerMusicality,
        stagePresence: data.challengerStagePresence,
        totalScore: challengerTotal,
        notes: data.notes ?? null,
      },
      {
        battleId: id,
        judgeId: session.user.id,
        dancerId: battle.opponentId,
        technique: data.opponentTechnique,
        creativity: data.opponentCreativity,
        musicality: data.opponentMusicality,
        stagePresence: data.opponentStagePresence,
        totalScore: opponentTotal,
        notes: data.notes ?? null,
      },
    ]);

    // Determine winner
    const winnerId = challengerTotal > opponentTotal
      ? battle.challengerId
      : challengerTotal < opponentTotal
        ? battle.opponentId
        : null; // draw

    // ELO calculation
    let ratingChange = 0;
    const battleStyle = battle.danceStyle || null;
    if (battle.seasonId) {
      const styleCondition = battleStyle
        ? eq(dancerRatings.danceStyle, battleStyle)
        : sql`${dancerRatings.danceStyle} IS NULL`;

      const [challengerRating, opponentRating] = await Promise.all([
        db.select().from(dancerRatings).where(
          and(eq(dancerRatings.userId, battle.challengerId), eq(dancerRatings.seasonId, battle.seasonId), styleCondition)
        ).limit(1),
        db.select().from(dancerRatings).where(
          and(eq(dancerRatings.userId, battle.opponentId), eq(dancerRatings.seasonId, battle.seasonId), styleCondition)
        ).limit(1),
      ]);

      const cRating = challengerRating[0]?.rating ?? 1000;
      const oRating = opponentRating[0]?.rating ?? 1000;
      const cBattles = challengerRating[0]?.totalBattles ?? 0;
      const oBattles = opponentRating[0]?.totalBattles ?? 0;

      if (winnerId) {
        const isChWinner = winnerId === battle.challengerId;
        const elo = calculateElo(
          isChWinner ? cRating : oRating,
          isChWinner ? oRating : cRating,
          isChWinner ? cBattles : oBattles,
          isChWinner ? oBattles : cBattles
        );

        ratingChange = elo.winnerChange;

        for (const { uId, newR, won } of [
          { uId: battle.challengerId, newR: isChWinner ? elo.winnerNewRating : elo.loserNewRating, won: isChWinner },
          { uId: battle.opponentId, newR: isChWinner ? elo.loserNewRating : elo.winnerNewRating, won: !isChWinner },
        ]) {
          const existing = await db.select().from(dancerRatings).where(
            and(eq(dancerRatings.userId, uId), eq(dancerRatings.seasonId, battle.seasonId), styleCondition)
          ).limit(1);

          if (existing.length > 0) {
            await db.update(dancerRatings).set({
              rating: newR,
              wins: won ? (existing[0].wins ?? 0) + 1 : existing[0].wins ?? 0,
              losses: !won ? (existing[0].losses ?? 0) + 1 : existing[0].losses ?? 0,
              totalBattles: (existing[0].totalBattles ?? 0) + 1,
              peakRating: Math.max(existing[0].peakRating ?? 0, newR),
              updatedAt: new Date(),
            }).where(eq(dancerRatings.id, existing[0].id));
          } else {
            await db.insert(dancerRatings).values({
              userId: uId,
              seasonId: battle.seasonId,
              danceStyle: battleStyle,
              rating: newR,
              wins: won ? 1 : 0,
              losses: won ? 0 : 1,
              totalBattles: 1,
              peakRating: newR,
            });
          }
        }
      } else {
        // Draw — update totalBattles and draws for both
        for (const uId of [battle.challengerId, battle.opponentId]) {
          const existing = await db.select().from(dancerRatings).where(
            and(eq(dancerRatings.userId, uId), eq(dancerRatings.seasonId, battle.seasonId), styleCondition)
          ).limit(1);

          if (existing.length > 0) {
            await db.update(dancerRatings).set({
              draws: (existing[0].draws ?? 0) + 1,
              totalBattles: (existing[0].totalBattles ?? 0) + 1,
              updatedAt: new Date(),
            }).where(eq(dancerRatings.id, existing[0].id));
          } else {
            await db.insert(dancerRatings).values({
              userId: uId,
              seasonId: battle.seasonId,
              danceStyle: battleStyle,
              rating: 1000,
              draws: 1,
              totalBattles: 1,
              peakRating: 1000,
            });
          }
        }
      }
    }

    // Update battle
    await db
      .update(battles)
      .set({
        status: "completed",
        challengerScore: challengerTotal,
        opponentScore: opponentTotal,
        winnerId,
        ratingChange,
        updatedAt: new Date(),
      })
      .where(eq(battles.id, id));

    // Notify dancers
    await Promise.all([
      createNotification(
        battle.challengerId,
        "battle_result",
        "Düello Sonuçlandı!",
        winnerId === battle.challengerId
          ? `Tebrikler! Düelloyu kazandınız! (+${ratingChange} puan)`
          : winnerId
            ? `Düelloyu kaybettiniz. (-${ratingChange} puan)`
            : "Düello berabere bitti!",
        { battleId: id, challengerScore: challengerTotal, opponentScore: opponentTotal }
      ),
      createNotification(
        battle.opponentId,
        "battle_result",
        "Düello Sonuçlandı!",
        winnerId === battle.opponentId
          ? `Tebrikler! Düelloyu kazandınız! (+${ratingChange} puan)`
          : winnerId
            ? `Düelloyu kaybettiniz. (-${ratingChange} puan)`
            : "Düello berabere bitti!",
        { battleId: id, challengerScore: challengerTotal, opponentScore: opponentTotal }
      ),
    ]);

    return NextResponse.json({
      message: "Düello puanlandı ve tamamlandı",
      challengerScore: challengerTotal,
      opponentScore: opponentTotal,
      winnerId,
      ratingChange,
    });
  } catch (error) {
    console.error("Score battle error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
