import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { announcements } from "@/db/schema/announcements";
import { users } from "@/db/schema/users";
import { notifications } from "@/db/schema/notifications";
import { auth } from "@/lib/auth";
import { eq, desc, ne } from "drizzle-orm";

// GET /api/announcements — List all published announcements
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const list = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        hasImage: announcements.imageData,
        hasFile: announcements.fileData,
        fileName: announcements.fileName,
        isPublished: announcements.isPublished,
        createdAt: announcements.createdAt,
        authorName: users.name,
        authorSurname: users.surname,
      })
      .from(announcements)
      .innerJoin(users, eq(announcements.authorId, users.id))
      .where(eq(announcements.isPublished, true))
      .orderBy(desc(announcements.createdAt))
      .limit(50);

    // Don't send binary data in list — just send boolean flags + serve URLs
    const mapped = list.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      fileName: a.fileName,
      isPublished: a.isPublished,
      createdAt: a.createdAt,
      authorName: a.authorName,
      authorSurname: a.authorSurname,
      imageUrl: a.hasImage ? `/api/announcements/${a.id}/image` : null,
      fileUrl: a.hasFile ? `/api/announcements/${a.id}/file` : null,
    }));

    return NextResponse.json({ announcements: mapped });
  } catch (error) {
    console.error("Get announcements error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/announcements — Create announcement (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const image = formData.get("image") as File | null;
    const file = formData.get("file") as File | null;
    const notify = formData.get("notify") === "true";

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Başlık ve içerik zorunlu" }, { status: 400 });
    }

    let imageData: string | null = null;
    let imageType: string | null = null;
    let fileData: string | null = null;
    let fileType: string | null = null;
    let fileName: string | null = null;

    // Store image as base64 in DB
    if (image && image.size > 0) {
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Görsel 5MB'dan büyük olamaz" }, { status: 400 });
      }
      const buffer = Buffer.from(await image.arrayBuffer());
      imageData = buffer.toString("base64");
      imageType = image.type;
    }

    // Store file as base64 in DB
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Dosya 10MB'dan büyük olamaz" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      fileData = buffer.toString("base64");
      fileType = file.type;
      fileName = file.name;
    }

    // Insert announcement
    const [newAnnouncement] = await db
      .insert(announcements)
      .values({
        authorId: session.user.id,
        title: title.trim(),
        content: content.trim(),
        imageData,
        imageType,
        fileData,
        fileType,
        fileName,
      })
      .returning();

    // Optionally send notification to all users
    if (notify) {
      const allUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(ne(users.id, session.user.id));

      if (allUsers.length > 0) {
        await db.insert(notifications).values(
          allUsers.map((u) => ({
            userId: u.id,
            type: "admin_announcement" as const,
            title: `📢 ${title.trim()}`,
            message: content.trim().substring(0, 200),
            data: { announcementId: newAnnouncement.id },
            channel: "in_app" as const,
          }))
        );
      }
    }

    return NextResponse.json({ announcement: newAnnouncement }, { status: 201 });
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/announcements?id=xxx — Delete announcement (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Duyuru ID gerekli" }, { status: 400 });
    }

    // Delete announcement — files stored in DB are deleted with the row
    await db.delete(announcements).where(eq(announcements.id, id));

    return NextResponse.json({ message: "Duyuru silindi" });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
