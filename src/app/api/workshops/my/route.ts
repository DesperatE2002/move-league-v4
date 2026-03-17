import { NextResponse } from "next/server";
import { db } from "@/db";
import { workshops, workshopEnrollments, workshopReviews } from "@/db/schema/workshops";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, and, desc, sql, count, avg } from "drizzle-orm";

// GET /api/workshops/my — Coach's own workshops with full stats + enrolled users
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    if (session.user.role !== "coach" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Sadece antrenörler erişebilir" }, { status: 403 });
    }

    const now = new Date();

    // Get all workshops by this coach
    const myWorkshops = await db
      .select()
      .from(workshops)
      .where(eq(workshops.coachId, session.user.id))
      .orderBy(desc(workshops.createdAt));

    // Get enrollment data for each workshop
    const workshopIds = myWorkshops.map((w) => w.id);
    if (workshopIds.length === 0) {
      return NextResponse.json({ workshops: [], stats: { total: 0, active: 0, expired: 0, totalEnrolled: 0, totalRevenue: 0, avgRating: null } });
    }

    const inClause = sql`${workshopEnrollments.workshopId} IN (${sql.join(workshopIds.map((id) => sql`${id}`), sql`, `)})`;

    // Per-workshop enrollment counts
    const enrollCounts = await db
      .select({ workshopId: workshopEnrollments.workshopId, count: count() })
      .from(workshopEnrollments)
      .where(and(inClause, eq(workshopEnrollments.status, "enrolled")))
      .groupBy(workshopEnrollments.workshopId);

    const enrollCountMap: Record<string, number> = {};
    for (const c of enrollCounts) {
      enrollCountMap[c.workshopId] = c.count;
    }

    // Per-workshop ratings
    const ratingInClause = sql`${workshopReviews.workshopId} IN (${sql.join(workshopIds.map((id) => sql`${id}`), sql`, `)})`;
    const ratings = await db
      .select({ workshopId: workshopReviews.workshopId, avg: avg(workshopReviews.rating), count: count() })
      .from(workshopReviews)
      .where(ratingInClause)
      .groupBy(workshopReviews.workshopId);

    const ratingMap: Record<string, { avg: number; count: number }> = {};
    for (const r of ratings) {
      ratingMap[r.workshopId] = { avg: r.avg ? Number(r.avg) : 0, count: r.count };
    }

    // All enrolled users with contact info (for all coach's workshops)
    const enrolledUsers = await db
      .select({
        workshopId: workshopEnrollments.workshopId,
        enrolledAt: workshopEnrollments.enrolledAt,
        status: workshopEnrollments.status,
        userId: users.id,
        name: users.name,
        surname: users.surname,
        username: users.username,
        email: users.email,
        city: users.city,
        country: users.country,
        danceStyle: users.danceStyle,
      })
      .from(workshopEnrollments)
      .innerJoin(users, eq(workshopEnrollments.userId, users.id))
      .where(and(inClause, eq(workshopEnrollments.status, "enrolled")))
      .orderBy(desc(workshopEnrollments.enrolledAt));

    // Group enrolled users by workshop
    const enrolledByWorkshop: Record<string, typeof enrolledUsers> = {};
    for (const e of enrolledUsers) {
      if (!enrolledByWorkshop[e.workshopId]) enrolledByWorkshop[e.workshopId] = [];
      enrolledByWorkshop[e.workshopId].push(e);
    }

    // Build enriched workshops
    const enriched = myWorkshops.map((w) => {
      const isExpired = w.type === "live" && w.scheduledDate && new Date(w.scheduledDate) < now;
      return {
        ...w,
        enrolledCount: enrollCountMap[w.id] ?? 0,
        avgRating: ratingMap[w.id]?.avg ?? null,
        reviewCount: ratingMap[w.id]?.count ?? 0,
        enrolledUsers: enrolledByWorkshop[w.id] ?? [],
        isExpired: !!isExpired,
      };
    });

    // Overall stats
    let totalEnrolled = 0;
    let totalRevenue = 0;
    let active = 0;
    let expired = 0;

    for (const w of enriched) {
      totalEnrolled += w.enrolledCount;
      totalRevenue += w.enrolledCount * Number(w.price || 0);
      if (w.isExpired) expired++;
      else if (w.isApproved && w.isPublished) active++;
    }

    const overallRating = await db
      .select({ avg: avg(workshopReviews.rating) })
      .from(workshopReviews)
      .where(ratingInClause);

    return NextResponse.json({
      workshops: enriched,
      stats: {
        total: myWorkshops.length,
        active,
        expired,
        totalEnrolled,
        totalRevenue,
        avgRating: overallRating[0]?.avg ? Number(overallRating[0].avg) : null,
      },
    });
  } catch (error) {
    console.error("Coach workshops error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
