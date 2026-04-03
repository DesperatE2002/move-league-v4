import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workshops, workshopEnrollments } from "@/db/schema/workshops";
import { auth } from "@/lib/auth";
import { eq, and, count } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

// POST /api/workshops/[id]/enroll — Enroll in workshop
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;

    // Check workshop exists and is approved
    const [workshop] = await db
      .select({ id: workshops.id, isPublished: workshops.isPublished, isApproved: workshops.isApproved, maxParticipants: workshops.maxParticipants })
      .from(workshops)
      .where(eq(workshops.id, id))
      .limit(1);

    if (!workshop) {
      return NextResponse.json({ error: "Atölye bulunamadı" }, { status: 404 });
    }

    if (!workshop.isPublished || !workshop.isApproved) {
      return NextResponse.json({ error: "Bu atölye henüz onaylanmamış" }, { status: 403 });
    }

    // Check enrollment capacity
    if (workshop.maxParticipants) {
      const [{ enrolledCount }] = await db
        .select({ enrolledCount: count() })
        .from(workshopEnrollments)
        .where(
          and(
            eq(workshopEnrollments.workshopId, id),
            eq(workshopEnrollments.status, "enrolled")
          )
        );
      if (enrolledCount >= workshop.maxParticipants) {
        return NextResponse.json({ error: "Atölye kapasitesi dolu" }, { status: 400 });
      }
    }

    // Check if already enrolled
    const existing = await db
      .select({ id: workshopEnrollments.id })
      .from(workshopEnrollments)
      .where(
        and(
          eq(workshopEnrollments.workshopId, id),
          eq(workshopEnrollments.userId, session.user.id),
          eq(workshopEnrollments.status, "enrolled")
        )
      )
      .limit(1);

    if (existing[0]) {
      return NextResponse.json({ error: "Zaten kayıtlısınız" }, { status: 400 });
    }

    await db.insert(workshopEnrollments).values({
      workshopId: id,
      userId: session.user.id,
      status: "enrolled",
    });

    // Send notification + email
    const [ws] = await db.select({ title: workshops.title }).from(workshops).where(eq(workshops.id, id)).limit(1);
    await createNotification(
      session.user.id,
      "workshop_purchased",
      "Atölye Kaydı Tamamlandı",
      `${ws?.title || "Atölye"} atölyesine başarıyla kaydoldunuz.`,
      { workshopId: id }
    );

    return NextResponse.json({ message: "Kayıt başarılı" }, { status: 201 });
  } catch (error) {
    console.error("Enroll error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/workshops/[id]/enroll — Cancel enrollment
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

    await db
      .update(workshopEnrollments)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(workshopEnrollments.workshopId, id),
          eq(workshopEnrollments.userId, session.user.id),
          eq(workshopEnrollments.status, "enrolled")
        )
      );

    return NextResponse.json({ message: "Kayıt iptal edildi" });
  } catch (error) {
    console.error("Cancel enrollment error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
