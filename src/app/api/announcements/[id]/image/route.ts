import { NextResponse } from "next/server";
import { db } from "@/db";
import { announcements } from "@/db/schema/announcements";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/announcements/[id]/image — Serve announcement image
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;

    const [row] = await db
      .select({ imageData: announcements.imageData, imageType: announcements.imageType })
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);

    if (!row?.imageData) {
      return NextResponse.json({ error: "Görsel bulunamadı" }, { status: 404 });
    }

    const buffer = Buffer.from(row.imageData, "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": row.imageType || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Serve image error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
