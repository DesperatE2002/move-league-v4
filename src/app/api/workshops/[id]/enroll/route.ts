import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workshopEnrollments } from "@/db/schema/workshops";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

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
