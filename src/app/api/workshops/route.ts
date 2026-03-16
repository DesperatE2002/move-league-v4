import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workshops, workshopEnrollments } from "@/db/schema/workshops";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { createWorkshopSchema } from "@/lib/validators";
import { eq, desc, sql, and, count } from "drizzle-orm";

// GET /api/workshops — List workshops
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const style = searchParams.get("style");
    const difficulty = searchParams.get("difficulty");
    const type = searchParams.get("type");

    let query = db
      .select({
        id: workshops.id,
        coachId: workshops.coachId,
        title: workshops.title,
        description: workshops.description,
        type: workshops.type,
        danceStyle: workshops.danceStyle,
        difficulty: workshops.difficulty,
        price: workshops.price,
        currency: workshops.currency,
        thumbnailUrl: workshops.thumbnailUrl,
        maxParticipants: workshops.maxParticipants,
        scheduledDate: workshops.scheduledDate,
        durationMinutes: workshops.durationMinutes,
        isPublished: workshops.isPublished,
        isApproved: workshops.isApproved,
        createdAt: workshops.createdAt,
      })
      .from(workshops)
      .where(
        and(
          eq(workshops.isPublished, true),
          eq(workshops.isApproved, true),
          style ? eq(workshops.danceStyle, style) : undefined,
          difficulty ? sql`${workshops.difficulty} = ${difficulty}` : undefined,
          type ? sql`${workshops.type} = ${type}` : undefined
        )
      )
      .orderBy(desc(workshops.createdAt))
      .limit(50);

    const rows = await query;

    // Enrich with coach info and enrollment count
    const coachIds = [...new Set(rows.map((w) => w.coachId))];
    const coachMap: Record<string, { name: string; surname: string; username: string; avatarUrl: string | null }> = {};

    if (coachIds.length > 0) {
      const coaches = await db
        .select({ id: users.id, name: users.name, surname: users.surname, username: users.username, avatarUrl: users.avatarUrl })
        .from(users)
        .where(sql`${users.id} IN (${sql.join(coachIds.map((id) => sql`${id}`), sql`, `)})`);
      for (const c of coaches) {
        coachMap[c.id] = { name: c.name, surname: c.surname, username: c.username, avatarUrl: c.avatarUrl };
      }
    }

    const workshopIds = rows.map((w) => w.id);
    const enrollCountMap: Record<string, number> = {};
    if (workshopIds.length > 0) {
      const counts = await db
        .select({ workshopId: workshopEnrollments.workshopId, count: count() })
        .from(workshopEnrollments)
        .where(
          and(
            sql`${workshopEnrollments.workshopId} IN (${sql.join(workshopIds.map((id) => sql`${id}`), sql`, `)})`,
            eq(workshopEnrollments.status, "enrolled")
          )
        )
        .groupBy(workshopEnrollments.workshopId);
      for (const c of counts) {
        enrollCountMap[c.workshopId] = c.count;
      }
    }

    const enriched = rows.map((w) => ({
      ...w,
      coach: coachMap[w.coachId] ?? null,
      enrolledCount: enrollCountMap[w.id] ?? 0,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Get workshops error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/workshops — Create workshop (coach only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    if (session.user.role !== "coach" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Sadece koçlar atölye oluşturabilir" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createWorkshopSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Geçersiz veri" }, { status: 400 });
    }

    const data = parsed.data;
    const isAdmin = session.user.role === "admin";

    const newWorkshop = await db
      .insert(workshops)
      .values({
        coachId: session.user.id,
        title: data.title,
        description: data.description || null,
        type: data.type,
        danceStyle: data.danceStyle || null,
        difficulty: data.difficulty || null,
        price: data.price ? String(data.price) : "0",
        currency: data.currency || "TRY",
        videoUrl: data.videoUrl || null,
        maxParticipants: data.maxParticipants || null,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        durationMinutes: data.durationMinutes || null,
        isPublished: true,
        isApproved: isAdmin,
      })
      .returning({ id: workshops.id });

    return NextResponse.json(
      { message: isAdmin ? "Atölye oluşturuldu" : "Atölye oluşturuldu, admin onayı bekleniyor", id: newWorkshop[0].id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create workshop error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
