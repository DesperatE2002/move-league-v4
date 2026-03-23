import { NextResponse } from "next/server";
import { db } from "@/db";
import { announcements } from "@/db/schema/announcements";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/announcements/[id]/file — Serve announcement file (PDF etc.)
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
      .select({
        fileData: announcements.fileData,
        fileType: announcements.fileType,
        fileName: announcements.fileName,
      })
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);

    if (!row?.fileData) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
    }

    const buffer = Buffer.from(row.fileData, "base64");
    const safeName = (row.fileName || "dosya").replace(/[^a-zA-Z0-9._-]/g, "_");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": row.fileType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Serve file error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
