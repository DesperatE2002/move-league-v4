import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workshops } from "@/db/schema/workshops";
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
    if (!workshopId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    if (action === "approve") {
      await db.update(workshops).set({ isApproved: true }).where(eq(workshops.id, workshopId));
    } else {
      await db.update(workshops).set({ isApproved: false, isPublished: false }).where(eq(workshops.id, workshopId));
    }

    return NextResponse.json({ message: action === "approve" ? "Atölye onaylandı" : "Atölye reddedildi" });
  } catch (error) {
    console.error("Admin workshop action error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
