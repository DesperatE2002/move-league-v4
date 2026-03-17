import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workshops, workshopEnrollments, workshopReviews } from "@/db/schema/workshops";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, and, count, avg, sql } from "drizzle-orm";

// GET /api/workshops/[id] — Workshop detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;

    const rows = await db
      .select()
      .from(workshops)
      .where(eq(workshops.id, id))
      .limit(1);

    if (!rows[0]) {
      return NextResponse.json({ error: "Atölye bulunamadı" }, { status: 404 });
    }

    const workshop = rows[0];

    // Coach info
    const coachArr = await db
      .select({ id: users.id, name: users.name, surname: users.surname, username: users.username, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, workshop.coachId))
      .limit(1);

    // Enrollment count
    const enrollArr = await db
      .select({ count: count() })
      .from(workshopEnrollments)
      .where(and(eq(workshopEnrollments.workshopId, id), eq(workshopEnrollments.status, "enrolled")));

    // Check if current user enrolled
    const myEnroll = await db
      .select({ id: workshopEnrollments.id, status: workshopEnrollments.status })
      .from(workshopEnrollments)
      .where(and(eq(workshopEnrollments.workshopId, id), eq(workshopEnrollments.userId, session.user.id)))
      .limit(1);

    // Average rating
    const avgArr = await db
      .select({ avg: avg(workshopReviews.rating), count: count() })
      .from(workshopReviews)
      .where(eq(workshopReviews.workshopId, id));

    // Reviews
    const reviews = await db
      .select({
        id: workshopReviews.id,
        rating: workshopReviews.rating,
        comment: workshopReviews.comment,
        createdAt: workshopReviews.createdAt,
        userId: workshopReviews.userId,
      })
      .from(workshopReviews)
      .where(eq(workshopReviews.workshopId, id))
      .orderBy(workshopReviews.createdAt)
      .limit(20);

    // Get reviewer names
    const reviewerIds = [...new Set(reviews.map((r) => r.userId))];
    const reviewerMap: Record<string, { name: string; surname: string; username: string }> = {};
    if (reviewerIds.length > 0) {
      const reviewers = await db
        .select({ id: users.id, name: users.name, surname: users.surname, username: users.username })
        .from(users)
        .where(sql`${users.id} IN (${sql.join(reviewerIds.map((rid) => sql`${rid}`), sql`, `)})`);
      for (const r of reviewers) {
        reviewerMap[r.id] = { name: r.name, surname: r.surname, username: r.username };
      }
    }

    return NextResponse.json({
      ...workshop,
      coach: coachArr[0] ?? null,
      enrolledCount: enrollArr[0]?.count ?? 0,
      myEnrollment: myEnroll[0] ?? null,
      avgRating: avgArr[0]?.avg ? Number(avgArr[0].avg) : null,
      reviewCount: avgArr[0]?.count ?? 0,
      reviews: reviews.map((r) => ({
        ...r,
        user: reviewerMap[r.userId] ?? null,
      })),
    });
  } catch (error) {
    console.error("Get workshop detail error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/workshops/[id] — Coach requests deletion (needs admin approval)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;

    const [workshop] = await db
      .select({ id: workshops.id, coachId: workshops.coachId })
      .from(workshops)
      .where(eq(workshops.id, id))
      .limit(1);

    if (!workshop) {
      return NextResponse.json({ error: "Atölye bulunamadı" }, { status: 404 });
    }

    if (workshop.coachId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    // Coach requests deletion — set flag for admin review
    await db
      .update(workshops)
      .set({ deletionRequestedAt: new Date() })
      .where(eq(workshops.id, id));

    return NextResponse.json({ message: "Silme talebi gönderildi, admin onayı bekleniyor" });
  } catch (error) {
    console.error("Workshop deletion request error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
