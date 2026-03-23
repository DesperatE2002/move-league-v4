import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { announcements } from "@/db/schema/announcements";
import { users } from "@/db/schema/users";
import { notifications } from "@/db/schema/notifications";
import { auth } from "@/lib/auth";
import { eq, desc, ne } from "drizzle-orm";
import { put, del } from "@vercel/blob";

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
        imageUrl: announcements.imageUrl,
        fileUrl: announcements.fileUrl,
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

    return NextResponse.json({ announcements: list });
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

    let imageUrl: string | null = null;
    let fileUrl: string | null = null;
    let fileName: string | null = null;

    // Check blob token before attempting uploads
    if ((image && image.size > 0) || (file && file.size > 0)) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
          { error: "Dosya yükleme servisi yapılandırılmamış. Vercel Blob token gerekli." },
          { status: 500 }
        );
      }
    }

    // Upload image if provided
    if (image && image.size > 0) {
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Görsel 5MB'dan büyük olamaz" }, { status: 400 });
      }
      const blob = await put(`announcements/img-${Date.now()}-${image.name}`, image, {
        access: "public",
        contentType: image.type,
      });
      imageUrl = blob.url;
    }

    // Upload file if provided
    if (file && file.size > 0) {
      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json({ error: "Dosya 20MB'dan büyük olamaz" }, { status: 400 });
      }
      const blob = await put(`announcements/file-${Date.now()}-${file.name}`, file, {
        access: "public",
        contentType: file.type,
      });
      fileUrl = blob.url;
      fileName = file.name;
    }

    // Insert announcement
    const [newAnnouncement] = await db
      .insert(announcements)
      .values({
        authorId: session.user.id,
        title: title.trim(),
        content: content.trim(),
        imageUrl,
        fileUrl,
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

    const [existing] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Duyuru bulunamadı" }, { status: 404 });
    }

    // Delete blob files
    try {
      if (existing.imageUrl) await del(existing.imageUrl);
      if (existing.fileUrl) await del(existing.fileUrl);
    } catch {
      // blob delete may fail silently, continue
    }

    await db.delete(announcements).where(eq(announcements.id, id));

    return NextResponse.json({ message: "Duyuru silindi" });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
