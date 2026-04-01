import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        surname: users.surname,
        username: users.username,
        role: users.role,
        avatarUrl: users.avatarUrl,
        city: users.city,
        country: users.country,
        gender: users.gender,
        danceStyle: users.danceStyle,
        bio: users.bio,
        language: users.language,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await req.json();

    // Handle isActive toggle separately
    if (body.isActive !== undefined && Object.keys(body).length === 1) {
      await db
        .update(users)
        .set({ isActive: Boolean(body.isActive), updatedAt: new Date() })
        .where(eq(users.id, session.user.id));
      return NextResponse.json({ success: true, isActive: Boolean(body.isActive) });
    }

    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Geçersiz veri";
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    const data = parsed.data;

    if (data.name) updateData.name = data.name;
    if (data.surname) updateData.surname = data.surname;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.danceStyle !== undefined) updateData.danceStyle = data.danceStyle;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.language) updateData.language = data.language;

    if (data.username) {
      const existingUsername = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, data.username))
        .limit(1);

      if (existingUsername.length > 0 && existingUsername[0].id !== session.user.id) {
        return NextResponse.json(
          { error: "Bu kullanıcı adı zaten kullanılıyor" },
          { status: 409 }
        );
      }
      updateData.username = data.username;
    }

    updateData.updatedAt = new Date();

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        name: users.name,
        surname: users.surname,
        username: users.username,
        city: users.city,
        country: users.country,
        gender: users.gender,
        danceStyle: users.danceStyle,
        bio: users.bio,
        language: users.language,
      });

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
