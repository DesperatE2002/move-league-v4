import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { privateLeagues, leagueMembers, leagueInvites, leagueBattles } from "@/db/schema/leagues";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, and, desc, sql } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/leagues/[id] — Lig detayı + sıralama + düellolar
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;

    const [league] = await db
      .select()
      .from(privateLeagues)
      .where(eq(privateLeagues.id, id))
      .limit(1);

    if (!league) {
      return NextResponse.json({ error: "Lig bulunamadı" }, { status: 404 });
    }

    // Üye sıralaması
    const members = await db
      .select({
        userId: leagueMembers.userId,
        rating: leagueMembers.rating,
        wins: leagueMembers.wins,
        losses: leagueMembers.losses,
        draws: leagueMembers.draws,
        totalBattles: leagueMembers.totalBattles,
        peakRating: leagueMembers.peakRating,
        joinedAt: leagueMembers.joinedAt,
        name: users.name,
        surname: users.surname,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(leagueMembers)
      .innerJoin(users, eq(users.id, leagueMembers.userId))
      .where(eq(leagueMembers.leagueId, id))
      .orderBy(desc(leagueMembers.rating));

    // Son düellolar
    const battles = await db
      .select()
      .from(leagueBattles)
      .where(eq(leagueBattles.leagueId, id))
      .orderBy(desc(leagueBattles.createdAt))
      .limit(20);

    // Düello katılımcı bilgileri
    const battleUserIds = new Set<string>();
    for (const b of battles) {
      battleUserIds.add(b.challengerId);
      battleUserIds.add(b.opponentId);
    }

    const battleUserMap: Record<string, { name: string; surname: string; username: string }> = {};
    if (battleUserIds.size > 0) {
      const userRows = await db
        .select({ id: users.id, name: users.name, surname: users.surname, username: users.username })
        .from(users)
        .where(sql`${users.id} IN (${sql.join([...battleUserIds].map(uid => sql`${uid}`), sql`, `)})`);
      for (const u of userRows) {
        battleUserMap[u.id] = { name: u.name, surname: u.surname, username: u.username };
      }
    }

    const enrichedBattles = battles.map(b => ({
      ...b,
      challenger: battleUserMap[b.challengerId] ?? null,
      opponent: battleUserMap[b.opponentId] ?? null,
    }));

    // Owner bilgisi
    const [owner] = await db
      .select({ name: users.name, surname: users.surname, username: users.username })
      .from(users)
      .where(eq(users.id, league.ownerId))
      .limit(1);

    return NextResponse.json({
      league: { ...league, owner },
      members,
      battles: enrichedBattles,
    });
  } catch (error) {
    console.error("Get league error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/leagues/[id] — Lig güncelle / aktifleştir / dansçı davet et
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const { action } = body;

    const [league] = await db
      .select()
      .from(privateLeagues)
      .where(eq(privateLeagues.id, id))
      .limit(1);

    if (!league) {
      return NextResponse.json({ error: "Lig bulunamadı" }, { status: 404 });
    }

    // Lig sahibi veya admin kontrolü
    const isOwner = league.ownerId === session.user.id;
    const isAdmin = session.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }

    // Lig bilgilerini güncelle
    if (action === "update") {
      const { name, description, danceStyle, maxMembers, startDate, endDate, firstPrize, secondPrize, thirdPrize, rules } = body;
      await db.update(privateLeagues).set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(danceStyle !== undefined && { danceStyle }),
        ...(maxMembers && { maxMembers }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(firstPrize !== undefined && { firstPrize }),
        ...(secondPrize !== undefined && { secondPrize }),
        ...(thirdPrize !== undefined && { thirdPrize }),
        ...(rules !== undefined && { rules }),
        updatedAt: new Date(),
      }).where(eq(privateLeagues.id, id));

      return NextResponse.json({ ok: true });
    }

    // Ligi aktifleştir
    if (action === "activate") {
      await db.update(privateLeagues).set({
        status: "active",
        updatedAt: new Date(),
      }).where(eq(privateLeagues.id, id));

      return NextResponse.json({ ok: true });
    }

    // Ligi tamamla
    if (action === "complete") {
      await db.update(privateLeagues).set({
        status: "completed",
        updatedAt: new Date(),
      }).where(eq(privateLeagues.id, id));

      return NextResponse.json({ ok: true });
    }

    // Dansçı davet et
    if (action === "invite") {
      const { userIds } = body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json({ error: "Davet edilecek kullanıcı seçin" }, { status: 400 });
      }

      const [ownerUser] = await db
        .select({ name: users.name, surname: users.surname })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      for (const userId of userIds) {
        // Zaten üye mi kontrol et
        const [existing] = await db
          .select({ id: leagueMembers.id })
          .from(leagueMembers)
          .where(and(eq(leagueMembers.leagueId, id), eq(leagueMembers.userId, userId)))
          .limit(1);
        if (existing) continue;

        // Zaten davet var mı
        const [existingInvite] = await db
          .select({ id: leagueInvites.id })
          .from(leagueInvites)
          .where(and(
            eq(leagueInvites.leagueId, id),
            eq(leagueInvites.userId, userId),
            eq(leagueInvites.status, "pending")
          ))
          .limit(1);
        if (existingInvite) continue;

        // Davet oluştur
        await db.insert(leagueInvites).values({
          leagueId: id,
          userId,
        });

        // Bildirim gönder
        await createNotification(
          userId,
          "team_invite",
          "Özel Lig Daveti",
          `${ownerUser?.name} ${ownerUser?.surname} sizi "${league.name}" özel ligine davet etti.`,
          { leagueId: id, type: "league_invite" }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Davete yanıt ver (dansçı tarafı)
    if (action === "respond-invite") {
      const { inviteId, response } = body; // response: "accepted" | "declined"

      const [invite] = await db
        .select()
        .from(leagueInvites)
        .where(
          and(
            eq(leagueInvites.id, inviteId),
            eq(leagueInvites.userId, session.user.id)
          )
        )
        .limit(1);

      if (!invite) {
        return NextResponse.json({ error: "Davet bulunamadı" }, { status: 404 });
      }

      await db.update(leagueInvites).set({
        status: response,
        respondedAt: new Date(),
      }).where(eq(leagueInvites.id, inviteId));

      if (response === "accepted") {
        // Üye olarak ekle
        await db.insert(leagueMembers).values({
          leagueId: invite.leagueId,
          userId: session.user.id,
        });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Geçersiz action" }, { status: 400 });
  } catch (error) {
    console.error("League patch error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/leagues/[id] — Lig içi düello puanlama (hakem/admin)
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const { battleId, challengerScore, opponentScore } = body;

    const [league] = await db
      .select()
      .from(privateLeagues)
      .where(eq(privateLeagues.id, id))
      .limit(1);

    if (!league) {
      return NextResponse.json({ error: "Lig bulunamadı" }, { status: 404 });
    }

    // Sadece lig sahibi veya admin puanlayabilir
    if (league.ownerId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Puanlama yetkiniz yok" }, { status: 403 });
    }

    const [battle] = await db
      .select()
      .from(leagueBattles)
      .where(and(eq(leagueBattles.id, battleId), eq(leagueBattles.leagueId, id)))
      .limit(1);

    if (!battle) {
      return NextResponse.json({ error: "Düello bulunamadı" }, { status: 404 });
    }

    if (battle.status === "completed") {
      return NextResponse.json({ error: "Bu düello zaten tamamlanmış" }, { status: 400 });
    }

    const cScore = Number(challengerScore);
    const oScore = Number(opponentScore);

    const winnerId = cScore > oScore ? battle.challengerId
      : oScore > cScore ? battle.opponentId
      : null;

    // Lig içi ELO hesapla
    const { calculateElo } = await import("@/lib/elo");

    const [challengerMember] = await db
      .select()
      .from(leagueMembers)
      .where(and(eq(leagueMembers.leagueId, id), eq(leagueMembers.userId, battle.challengerId)))
      .limit(1);

    const [opponentMember] = await db
      .select()
      .from(leagueMembers)
      .where(and(eq(leagueMembers.leagueId, id), eq(leagueMembers.userId, battle.opponentId)))
      .limit(1);

    const cRating = challengerMember?.rating ?? 1000;
    const oRating = opponentMember?.rating ?? 1000;
    let ratingChange = 0;

    if (winnerId) {
      const isChWinner = winnerId === battle.challengerId;
      const elo = calculateElo(
        isChWinner ? cRating : oRating,
        isChWinner ? oRating : cRating,
        isChWinner ? (challengerMember?.totalBattles ?? 0) : (opponentMember?.totalBattles ?? 0),
        isChWinner ? (opponentMember?.totalBattles ?? 0) : (challengerMember?.totalBattles ?? 0)
      );

      ratingChange = elo.winnerChange;

      // Challenger güncelle
      if (challengerMember) {
        await db.update(leagueMembers).set({
          rating: isChWinner ? elo.winnerNewRating : elo.loserNewRating,
          wins: isChWinner ? (challengerMember.wins ?? 0) + 1 : challengerMember.wins ?? 0,
          losses: !isChWinner ? (challengerMember.losses ?? 0) + 1 : challengerMember.losses ?? 0,
          totalBattles: (challengerMember.totalBattles ?? 0) + 1,
          peakRating: Math.max(challengerMember.peakRating ?? 0, isChWinner ? elo.winnerNewRating : elo.loserNewRating),
        }).where(eq(leagueMembers.id, challengerMember.id));
      }

      // Opponent güncelle
      if (opponentMember) {
        await db.update(leagueMembers).set({
          rating: isChWinner ? elo.loserNewRating : elo.winnerNewRating,
          wins: !isChWinner ? (opponentMember.wins ?? 0) + 1 : opponentMember.wins ?? 0,
          losses: isChWinner ? (opponentMember.losses ?? 0) + 1 : opponentMember.losses ?? 0,
          totalBattles: (opponentMember.totalBattles ?? 0) + 1,
          peakRating: Math.max(opponentMember.peakRating ?? 0, !isChWinner ? elo.winnerNewRating : elo.loserNewRating),
        }).where(eq(leagueMembers.id, opponentMember.id));
      }
    }

    // Düelloyu tamamla
    await db.update(leagueBattles).set({
      status: "completed",
      challengerScore: cScore,
      opponentScore: oScore,
      winnerId,
      ratingChange,
      updatedAt: new Date(),
    }).where(eq(leagueBattles.id, battleId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("League battle score error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
