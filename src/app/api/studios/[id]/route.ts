import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/studios/[id] — Get studio detail
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;

    const result = await db
      .select()
      .from(studios)
      .where(eq(studios.id, id))
      .limit(1);

    if (!result[0]) {
      return NextResponse.json({ error: "Stüdyo bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ studio: result[0] });
  } catch (error) {
    console.error("Get studio error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/studios/[id] — Update studio
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await ctx.params;

    // Check ownership
    const existing = await db
      .select()
      .from(studios)
      .where(eq(studios.id, id))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json({ error: "Stüdyo bulunamadı" }, { status: 404 });
    }

    if (existing[0].ownerId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, address, city, country, phone, isAvailable } = body;

    await db
      .update(studios)
      .set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(address && { address }),
        ...(city && { city }),
        ...(country && { country }),
        ...(phone !== undefined && { phone }),
        ...(isAvailable !== undefined && { isAvailable }),
      })
      .where(eq(studios.id, id));

    return NextResponse.json({ message: "Stüdyo güncellendi" });
  } catch (error) {
    console.error("Update studio error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
