import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios, studioAvailability } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/studios/[id]/availability — Get studio availability
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;

    const result = await db
      .select()
      .from(studioAvailability)
      .where(eq(studioAvailability.studioId, id));

    return NextResponse.json({ availability: result });
  } catch (error) {
    console.error("Get studio availability error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/studios/[id]/availability — Update studio availability
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;

    // Check ownership
    const studio = await db
      .select()
      .from(studios)
      .where(eq(studios.id, id))
      .limit(1);

    if (!studio[0]) {
      return NextResponse.json({ error: "Stüdyo bulunamadı" }, { status: 404 });
    }

    if (studio[0].ownerId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
    }

    const body = await req.json();
    const { slots } = body as {
      slots: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
      }>;
    };

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    // Delete existing and re-insert
    await db
      .delete(studioAvailability)
      .where(eq(studioAvailability.studioId, id));

    if (slots.length > 0) {
      await db.insert(studioAvailability).values(
        slots.map((s) => ({
          studioId: id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isAvailable: s.isAvailable,
        }))
      );
    }

    return NextResponse.json({ message: "Müsaitlik güncellendi" });
  } catch (error) {
    console.error("Update studio availability error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
