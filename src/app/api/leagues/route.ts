import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { privateLeagues, leagueMembers, leagueInvites } from "@/db/schema/leagues";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, and, or, desc, sql, count } from "drizzle-orm";

// GET /api/leagues — Listeyi getir (stüdyo kendi ligleri + dansçı katıldığı ligler)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode"); // "my" | "joined" | "invites" | "all"

    // Studio owner: kendi oluşturduğu ligler
    if (mode === "my" || session.user.role === "studio") {
      const leagues = await db
        .select({
          id: privateLeagues.id,
          name: privateLeagues.name,
          description: privateLeagues.description,
          danceStyle: privateLeagues.danceStyle,
          maxMembers: privateLeagues.maxMembers,
          startDate: privateLeagues.startDate,
          endDate: privateLeagues.endDate,
          status: privateLeagues.status,
          firstPrize: privateLeagues.firstPrize,
          secondPrize: privateLeagues.secondPrize,
          thirdPrize: privateLeagues.thirdPrize,
          createdAt: privateLeagues.createdAt,
          memberCount: sql<number>`(SELECT COUNT(*) FROM league_members WHERE league_id = ${privateLeagues.id})`,
        })
        .from(privateLeagues)
        .where(eq(privateLeagues.ownerId, userId))
        .orderBy(desc(privateLeagues.createdAt));

      return NextResponse.json({ leagues });
    }

    // Dansçı: katıldığı ligler
    if (mode === "joined") {
      const joined = await db
        .select({
          id: privateLeagues.id,
          name: privateLeagues.name,
          description: privateLeagues.description,
          danceStyle: privateLeagues.danceStyle,
          startDate: privateLeagues.startDate,
          endDate: privateLeagues.endDate,
          status: privateLeagues.status,
          firstPrize: privateLeagues.firstPrize,
          secondPrize: privateLeagues.secondPrize,
          thirdPrize: privateLeagues.thirdPrize,
          myRating: leagueMembers.rating,
          myWins: leagueMembers.wins,
          myLosses: leagueMembers.losses,
          memberCount: sql<number>`(SELECT COUNT(*) FROM league_members WHERE league_id = ${privateLeagues.id})`,
        })
        .from(leagueMembers)
        .innerJoin(privateLeagues, eq(privateLeagues.id, leagueMembers.leagueId))
        .where(eq(leagueMembers.userId, userId))
        .orderBy(desc(privateLeagues.createdAt));

      return NextResponse.json({ leagues: joined });
    }

    // Dansçı: bekleyen davetler
    if (mode === "invites") {
      const invites = await db
        .select({
          inviteId: leagueInvites.id,
          leagueId: privateLeagues.id,
          leagueName: privateLeagues.name,
          description: privateLeagues.description,
          danceStyle: privateLeagues.danceStyle,
          startDate: privateLeagues.startDate,
          endDate: privateLeagues.endDate,
          firstPrize: privateLeagues.firstPrize,
          ownerName: users.name,
          ownerSurname: users.surname,
          createdAt: leagueInvites.createdAt,
        })
        .from(leagueInvites)
        .innerJoin(privateLeagues, eq(privateLeagues.id, leagueInvites.leagueId))
        .innerJoin(users, eq(users.id, privateLeagues.ownerId))
        .where(
          and(
            eq(leagueInvites.userId, userId),
            eq(leagueInvites.status, "pending")
          )
        )
        .orderBy(desc(leagueInvites.createdAt));

      return NextResponse.json({ invites });
    }

    // Default: all active leagues (for browsing)
    const leagues = await db
      .select({
        id: privateLeagues.id,
        name: privateLeagues.name,
        description: privateLeagues.description,
        danceStyle: privateLeagues.danceStyle,
        startDate: privateLeagues.startDate,
        endDate: privateLeagues.endDate,
        status: privateLeagues.status,
        firstPrize: privateLeagues.firstPrize,
        memberCount: sql<number>`(SELECT COUNT(*) FROM league_members WHERE league_id = ${privateLeagues.id})`,
        maxMembers: privateLeagues.maxMembers,
      })
      .from(privateLeagues)
      .where(eq(privateLeagues.status, "active"))
      .orderBy(desc(privateLeagues.createdAt));

    return NextResponse.json({ leagues });
  } catch (error) {
    console.error("Get leagues error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/leagues — Yeni lig oluştur (sadece stüdyo)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    if (session.user.role !== "studio" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Sadece stüdyo hesapları lig oluşturabilir" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, danceStyle, maxMembers, startDate, endDate, firstPrize, secondPrize, thirdPrize, rules } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Lig adı, başlangıç ve bitiş tarihi zorunlu" }, { status: 400 });
    }

    const [league] = await db
      .insert(privateLeagues)
      .values({
        ownerId: session.user.id,
        name,
        description: description || null,
        danceStyle: danceStyle || null,
        maxMembers: maxMembers || 20,
        startDate,
        endDate,
        status: "draft",
        firstPrize: firstPrize || null,
        secondPrize: secondPrize || null,
        thirdPrize: thirdPrize || null,
        rules: rules || null,
      })
      .returning({ id: privateLeagues.id });

    return NextResponse.json({ id: league.id }, { status: 201 });
  } catch (error) {
    console.error("Create league error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
