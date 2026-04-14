import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { battles } from "@/db/schema/battles";
import { users } from "@/db/schema/users";
import { seasons } from "@/db/schema/seasons";
import { dancerRatings } from "@/db/schema/seasons";
import { auth } from "@/lib/auth";
import { createBattleSchema } from "@/lib/validators";
import { createNotification } from "@/lib/notifications";
import { eq, or, and, desc, sql } from "drizzle-orm";

// GET /api/battles — Düellolarımı listele
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const userId = session.user.id;
    const isJudge = session.user.role === "judge";

    const allBattles = await db
      .select({
        id: battles.id,
        challengerId: battles.challengerId,
        opponentId: battles.opponentId,
        judgeId: battles.judgeId,
        status: battles.status,
        scheduledDate: battles.scheduledDate,
        challengerScore: battles.challengerScore,
        opponentScore: battles.opponentScore,
        winnerId: battles.winnerId,
        ratingChange: battles.ratingChange,
        createdAt: battles.createdAt,
      })
      .from(battles)
      .where(
        isJudge
          ? or(
              eq(battles.judgeId, userId),
              eq(battles.challengerId, userId),
              eq(battles.opponentId, userId)
            )
          : or(
              eq(battles.challengerId, userId),
              eq(battles.opponentId, userId)
            )
      )
      .orderBy(desc(battles.createdAt))
      .limit(50);

    // Filter by status if provided
    const filtered = status
      ? allBattles.filter((b) => b.status === status)
      : allBattles;

    // Enrich with usernames
    const userIds = new Set<string>();
    for (const b of filtered) {
      userIds.add(b.challengerId);
      userIds.add(b.opponentId);
    }

    const userMap: Record<string, { name: string; surname: string; username: string; avatarUrl: string | null }> = {};
    if (userIds.size > 0) {
      const userRows = await db
        .select({
          id: users.id,
          name: users.name,
          surname: users.surname,
          username: users.username,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(
          sql`${users.id} IN (${sql.join(
            [...userIds].map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      for (const u of userRows) {
        userMap[u.id] = { name: u.name, surname: u.surname, username: u.username, avatarUrl: u.avatarUrl };
      }
    }

    const enriched = filtered.map((b) => ({
      ...b,
      challenger: userMap[b.challengerId] ?? null,
      opponent: userMap[b.opponentId] ?? null,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Get battles error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/battles — Düello talebi oluştur
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    // Only dancers (and admins) can create battles
    const userRole = session.user.role;
    if (userRole === "studio" || userRole === "judge") {
      return NextResponse.json(
        { error: "Stüdyo ve hakem hesapları düello oluşturamaz" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createBattleSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Geçersiz veri";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { opponentId, danceStyle } = parsed.data;
    const challengerId = session.user.id;

    // Self-challenge check
    if (challengerId === opponentId) {
      return NextResponse.json(
        { error: "Kendinize düello atamazsınız" },
        { status: 400 }
      );
    }

    // Check challenger is active
    const challengerUser = await db
      .select({ isActive: users.isActive })
      .from(users)
      .where(eq(users.id, challengerId))
      .limit(1);

    if (challengerUser.length > 0 && !challengerUser[0].isActive) {
      return NextResponse.json(
        { error: "Pasif moddayken düello atamazsınız. Ayarlardan aktif moda geçin." },
        { status: 400 }
      );
    }

    // Check opponent exists and is dancer
    const opponent = await db
      .select({ id: users.id, name: users.name, role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, opponentId))
      .limit(1);

    if (opponent.length === 0) {
      return NextResponse.json({ error: "Rakip bulunamadı" }, { status: 404 });
    }

    if (!opponent[0].isActive) {
      return NextResponse.json({ error: "Rakip aktif değil" }, { status: 400 });
    }

    // Rate limit: max 5 pending battles per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBattles = await db
      .select({ id: battles.id })
      .from(battles)
      .where(
        and(
          eq(battles.challengerId, challengerId),
          eq(battles.status, "pending"),
          sql`${battles.createdAt} >= ${today}`
        )
      );

    if (todayBattles.length >= 5) {
      return NextResponse.json(
        { error: "Günlük düello talebi limitine ulaştınız (max 5)" },
        { status: 429 }
      );
    }

    // Check no existing pending battle between these two
    const existing = await db
      .select({ id: battles.id })
      .from(battles)
      .where(
        and(
          or(
            and(eq(battles.challengerId, challengerId), eq(battles.opponentId, opponentId)),
            and(eq(battles.challengerId, opponentId), eq(battles.opponentId, challengerId))
          ),
          sql`${battles.status} IN ('pending', 'accepted', 'studio_pending', 'scheduled', 'judge_assigned', 'in_progress')`
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Bu rakiple zaten aktif bir düellonuz var" },
        { status: 409 }
      );
    }

    // Get active season
    const activeSeason = await db
      .select({ id: seasons.id })
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);

    // Create battle
    const newBattle = await db
      .insert(battles)
      .values({
        challengerId,
        opponentId,
        seasonId: activeSeason[0]?.id ?? null,
        danceStyle: danceStyle || null,
        status: "pending",
      })
      .returning({
        id: battles.id,
        status: battles.status,
        createdAt: battles.createdAt,
      });

    // Create notification for opponent (also sends email)
    await createNotification(
      opponentId,
      "battle_request",
      "Yeni Düello Talebi!",
      `${session.user.name} seni düelloya davet etti!`,
      { battleId: newBattle[0].id, challengerName: session.user.name }
    );

    return NextResponse.json(
      { message: "Düello talebi gönderildi", battle: newBattle[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create battle error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
