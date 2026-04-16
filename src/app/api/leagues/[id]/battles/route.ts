import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { privateLeagues, leagueMembers, leagueBattles } from "@/db/schema/leagues";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/leagues/[id]/battles — Lig içi düello oluştur
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const { opponentId, scheduledDate } = body;

    // Lig kontrolü
    const [league] = await db
      .select()
      .from(privateLeagues)
      .where(eq(privateLeagues.id, id))
      .limit(1);

    if (!league || league.status !== "active") {
      return NextResponse.json({ error: "Aktif lig bulunamadı" }, { status: 404 });
    }

    // Her iki taraf da üye mi kontrol et
    const [challengerMember] = await db
      .select({ id: leagueMembers.id })
      .from(leagueMembers)
      .where(and(eq(leagueMembers.leagueId, id), eq(leagueMembers.userId, session.user.id)))
      .limit(1);

    const [opponentMember] = await db
      .select({ id: leagueMembers.id })
      .from(leagueMembers)
      .where(and(eq(leagueMembers.leagueId, id), eq(leagueMembers.userId, opponentId)))
      .limit(1);

    if (!challengerMember || !opponentMember) {
      return NextResponse.json({ error: "Her iki taraf da lig üyesi olmalı" }, { status: 400 });
    }

    // Düello oluştur
    const [battle] = await db.insert(leagueBattles).values({
      leagueId: id,
      challengerId: session.user.id,
      opponentId,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      status: "pending",
    }).returning({ id: leagueBattles.id });

    // Bildirim gönder
    const [challenger] = await db
      .select({ name: users.name, surname: users.surname })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    await createNotification(
      opponentId,
      "battle_request",
      "Lig Düellosu Talebi",
      `${challenger?.name} ${challenger?.surname} sizi "${league.name}" liginde düelloya davet etti.`,
      { leagueId: id, battleId: battle.id, type: "league_battle" }
    );

    return NextResponse.json({ id: battle.id }, { status: 201 });
  } catch (error) {
    console.error("League battle create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
