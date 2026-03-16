import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workshopReviews } from "@/db/schema/workshops";
import { auth } from "@/lib/auth";
import { workshopReviewSchema } from "@/lib/validators";
import { eq, and } from "drizzle-orm";

// POST /api/workshops/[id]/reviews — Add review
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
    const body = await req.json();
    const parsed = workshopReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Geçersiz veri" }, { status: 400 });
    }

    // Check if already reviewed
    const existing = await db
      .select({ id: workshopReviews.id })
      .from(workshopReviews)
      .where(
        and(
          eq(workshopReviews.workshopId, id),
          eq(workshopReviews.userId, session.user.id)
        )
      )
      .limit(1);

    if (existing[0]) {
      return NextResponse.json({ error: "Bu atölyeyi zaten değerlendirdiniz" }, { status: 400 });
    }

    await db.insert(workshopReviews).values({
      workshopId: id,
      userId: session.user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    });

    return NextResponse.json({ message: "Değerlendirme eklendi" }, { status: 201 });
  } catch (error) {
    console.error("Add review error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
