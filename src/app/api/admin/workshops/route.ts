import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workshops, workshopEnrollments, workshopReviews, workshopMessages } from "@/db/schema/workshops";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

// GET /api/admin/workshops — List all workshops (admin)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const rows = await db
      .select()
      .from(workshops)
      .orderBy(desc(workshops.createdAt))
      .limit(100);

    const coachIds = [...new Set(rows.map((w) => w.coachId))];
    const coachMap: Record<string, { name: string; surname: string; username: string }> = {};
    if (coachIds.length > 0) {
      const coaches = await db
        .select({ id: users.id, name: users.name, surname: users.surname, username: users.username })
        .from(users)
        .where(sql`${users.id} IN (${sql.join(coachIds.map((id) => sql`${id}`), sql`, `)})`);
      for (const c of coaches) {
        coachMap[c.id] = { name: c.name, surname: c.surname, username: c.username };
      }
    }

    return NextResponse.json(
      rows.map((w) => ({ ...w, coach: coachMap[w.coachId] ?? null }))
    );
  } catch (error) {
    console.error("Admin workshops error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/admin/workshops — Approve/reject workshop
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { workshopId, action } = await req.json();
    if (!workshopId || !["approve", "reject", "approve_deletion", "reject_deletion"].includes(action)) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    if (action === "approve") {
      await db.update(workshops).set({ isApproved: true, deletionRequestedAt: null }).where(eq(workshops.id, workshopId));
    } else if (action === "reject") {
      await db.update(workshops).set({ isApproved: false, isPublished: false }).where(eq(workshops.id, workshopId));
    } else if (action === "approve_deletion") {
      // Admin approves coach's deletion request — hard delete
      await db.delete(workshopMessages).where(eq(workshopMessages.workshopId, workshopId));
      await db.delete(workshopReviews).where(eq(workshopReviews.workshopId, workshopId));
      await db.delete(workshopEnrollments).where(eq(workshopEnrollments.workshopId, workshopId));
      await db.delete(workshops).where(eq(workshops.id, workshopId));
      return NextResponse.json({ message: "Atölye silindi" });
    } else if (action === "reject_deletion") {
      // Admin rejects deletion request
      await db.update(workshops).set({ deletionRequestedAt: null }).where(eq(workshops.id, workshopId));
      return NextResponse.json({ message: "Silme talebi reddedildi" });
    }

    return NextResponse.json({ message: action === "approve" ? "Atölye onaylandı" : "Atölye reddedildi" });
  } catch (error) {
    console.error("Admin workshop action error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/admin/workshops — Admin directly deletes a workshop
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { workshopId } = await req.json();
    if (!workshopId) {
      return NextResponse.json({ error: "Workshop ID gerekli" }, { status: 400 });
    }

    const [workshop] = await db.select({ id: workshops.id }).from(workshops).where(eq(workshops.id, workshopId)).limit(1);
    if (!workshop) {
      return NextResponse.json({ error: "Atölye bulunamadı" }, { status: 404 });
    }

    await db.delete(workshopMessages).where(eq(workshopMessages.workshopId, workshopId));
    await db.delete(workshopReviews).where(eq(workshopReviews.workshopId, workshopId));
    await db.delete(workshopEnrollments).where(eq(workshopEnrollments.workshopId, workshopId));
    await db.delete(workshops).where(eq(workshops.id, workshopId));

    return NextResponse.json({ message: "Atölye silindi" });
  } catch (error) {
    console.error("Admin delete workshop error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
