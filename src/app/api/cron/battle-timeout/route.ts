import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { battles } from "@/db/schema/battles";
import { users } from "@/db/schema/users";
import { dancerRatings, seasons } from "@/db/schema/seasons";
import { notifications } from "@/db/schema/notifications";
import { calculateElo } from "@/lib/elo";
import { eq, and, sql, lt } from "drizzle-orm";

// Vercel Cron veya harici servis tarafından çağrılır
// 5 gün içinde yanıt verilmeyen pending battle'ları otomatik kaybettirir
export async function GET(req: NextRequest) {
  // Cron secret ile güvenlik
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // 5 günden eski pending battle'ları bul
    const expiredBattles = await db
      .select()
      .from(battles)
      .where(
        and(
          eq(battles.status, "pending"),
          lt(battles.createdAt, fiveDaysAgo)
        )
      );

    let processed = 0;

    for (const battle of expiredBattles) {
      // Opponent yanıt vermedi — otomatik kayıp
      const loserId = battle.opponentId;
      const challengerId = battle.challengerId;

      // Aktif sezonu bul
      const activeSeason = await db
        .select({ id: seasons.id })
        .from(seasons)
        .where(eq(seasons.isActive, true))
        .limit(1);

      if (!activeSeason[0]) continue;

      const battleStyle = battle.danceStyle || null;
      const styleCondition = battleStyle
        ? eq(dancerRatings.danceStyle, battleStyle)
        : sql`${dancerRatings.danceStyle} IS NULL`;

      // Rakibin (loser) mevcut rating'ini al
      const [loserRatingRow] = await db
        .select()
        .from(dancerRatings)
        .where(
          and(
            eq(dancerRatings.userId, loserId),
            eq(dancerRatings.seasonId, activeSeason[0].id),
            styleCondition
          )
        )
        .limit(1);

      const [challengerRatingRow] = await db
        .select()
        .from(dancerRatings)
        .where(
          and(
            eq(dancerRatings.userId, challengerId),
            eq(dancerRatings.seasonId, activeSeason[0].id),
            styleCondition
          )
        )
        .limit(1);

      const loserRating = loserRatingRow?.rating ?? 1000;
      const challengerRating = challengerRatingRow?.rating ?? 1000;
      const loserBattles = loserRatingRow?.totalBattles ?? 0;
      const challengerBattles = challengerRatingRow?.totalBattles ?? 0;

      // ELO hesapla — challenger kazanan ama puanı değişmeyecek, sadece loser düşecek
      const elo = calculateElo(challengerRating, loserRating, challengerBattles, loserBattles);
      const loserNewRating = elo.loserNewRating;
      const ratingChange = Math.abs(elo.loserChange);

      // Loser rating güncelle
      if (loserRatingRow) {
        await db.update(dancerRatings).set({
          rating: loserNewRating,
          losses: (loserRatingRow.losses ?? 0) + 1,
          totalBattles: (loserRatingRow.totalBattles ?? 0) + 1,
          updatedAt: new Date(),
        }).where(eq(dancerRatings.id, loserRatingRow.id));
      } else {
        await db.insert(dancerRatings).values({
          userId: loserId,
          seasonId: activeSeason[0].id,
          danceStyle: battleStyle,
          rating: loserNewRating,
          losses: 1,
          totalBattles: 1,
          peakRating: 1000,
        });
      }

      // Battle'ı completed yap — winnerId challenger
      await db.update(battles).set({
        status: "completed",
        winnerId: challengerId,
        ratingChange,
        updatedAt: new Date(),
      }).where(eq(battles.id, battle.id));

      // Opponent'a bildirim gönder
      const [challengerUser] = await db
        .select({ name: users.name, surname: users.surname })
        .from(users)
        .where(eq(users.id, challengerId))
        .limit(1);

      await db.insert(notifications).values({
        userId: loserId,
        type: "battle_reminder",
        title: "Düello Zaman Aşımı",
        message: `${challengerUser?.name} ${challengerUser?.surname} tarafından gönderilen düello talebine 5 gün içinde yanıt vermediniz. Maç kaybı olarak sayıldı ve ${ratingChange} ELO puan kaybettiniz.`,
        data: { battleId: battle.id, type: "timeout" },
        channel: "in_app",
      });

      // Challenger'a da bilgilendir
      const [loserUser] = await db
        .select({ name: users.name, surname: users.surname })
        .from(users)
        .where(eq(users.id, loserId))
        .limit(1);

      await db.insert(notifications).values({
        userId: challengerId,
        type: "battle_reminder",
        title: "Düello Zaman Aşımı — Galibiyet",
        message: `${loserUser?.name} ${loserUser?.surname} düello talebinize 5 gün içinde yanıt vermedi. Maç galibiyet olarak tescillendi. Puanınız sabit kaldı.`,
        data: { battleId: battle.id, type: "timeout" },
        channel: "in_app",
      });

      processed++;
    }

    return NextResponse.json({ ok: true, processed });
  } catch (error) {
    console.error("Battle timeout cron error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
