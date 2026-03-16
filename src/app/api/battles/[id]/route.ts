import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { battles } from "@/db/schema/battles";
import { battleScores } from "@/db/schema/battles";
import { users } from "@/db/schema/users";
import { dancerRatings } from "@/db/schema/seasons";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { calculateElo } from "@/lib/elo";
import { battleScoreSchema } from "@/lib/validators";
import { eq, and } from "drizzle-orm";

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

    return NextResponse.json({
      ...battle,
      challenger: challengerArr[0] ?? null,
      opponent: opponentArr[0] ?? null,
      scores,
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
          .set({ status: "accepted", updatedAt: new Date() })
          .where(eq(battles.id, id));

        await createNotification(
          battle.challengerId,
          "battle_accepted",
          "Düello Kabul Edildi!",
          `${session.user.name} düello talebinizi kabul etti!`,
          { battleId: id }
        );

        return NextResponse.json({ message: "Düello kabul edildi", status: "accepted" });
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
        if (!["pending", "accepted"].includes(battle.status)) {
          return NextResponse.json({ error: "Bu aşamada iptal edilemez" }, { status: 400 });
        }

        await db
          .update(battles)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(battles.id, id));

        return NextResponse.json({ message: "Düello iptal edildi", status: "cancelled" });
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
        const msg = `Düellonuz planlandı: ${new Date(scheduledDate).toLocaleDateString("tr-TR")}`;
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

    if (!["judge_assigned", "scheduled", "accepted"].includes(battle.status)) {
      return NextResponse.json({ error: "Bu düello puanlanamaz" }, { status: 400 });
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
    if (battle.seasonId && winnerId) {
      const [challengerRating, opponentRating] = await Promise.all([
        db.select().from(dancerRatings).where(
          and(eq(dancerRatings.userId, battle.challengerId), eq(dancerRatings.seasonId, battle.seasonId))
        ).limit(1),
        db.select().from(dancerRatings).where(
          and(eq(dancerRatings.userId, battle.opponentId), eq(dancerRatings.seasonId, battle.seasonId))
        ).limit(1),
      ]);

      const cRating = challengerRating[0]?.rating ?? 1000;
      const oRating = opponentRating[0]?.rating ?? 1000;
      const cBattles = challengerRating[0]?.totalBattles ?? 0;
      const oBattles = opponentRating[0]?.totalBattles ?? 0;

      const isChWinner = winnerId === battle.challengerId;
      const elo = calculateElo(
        isChWinner ? cRating : oRating,
        isChWinner ? oRating : cRating,
        isChWinner ? cBattles : oBattles,
        isChWinner ? oBattles : cBattles
      );

      ratingChange = elo.winnerChange;

      // Upsert ratings for both dancers
      const winnerNewR = isChWinner ? elo.winnerNewRating : elo.loserNewRating;
      const loserNewR = isChWinner ? elo.loserNewRating : elo.winnerNewRating;

      for (const { uId, newR, won } of [
        { uId: battle.challengerId, newR: isChWinner ? winnerNewR : loserNewR, won: isChWinner },
        { uId: battle.opponentId, newR: isChWinner ? loserNewR : winnerNewR, won: !isChWinner },
      ]) {
        const existing = await db.select().from(dancerRatings).where(
          and(eq(dancerRatings.userId, uId), eq(dancerRatings.seasonId, battle.seasonId))
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
            rating: newR,
            wins: won ? 1 : 0,
            losses: won ? 0 : 1,
            totalBattles: 1,
            peakRating: newR,
          });
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
    const winnerName = winnerId === battle.challengerId ? "Challenger" : "Opponent";
    await Promise.all([
      createNotification(
        battle.challengerId,
        "battle_result",
        "Düello Sonuçlandı!",
        winnerId === battle.challengerId
          ? `Tebrikler! Düelloyu kazandınız! (+${ratingChange} puan)`
          : winnerId
            ? `Düelloyu kaybettiniz. (${ratingChange} puan)`
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
            ? `Düelloyu kaybettiniz. (${ratingChange} puan)`
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
