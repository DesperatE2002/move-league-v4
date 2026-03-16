import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teamMembers, teams } from "@/db/schema/teams";
import { users } from "@/db/schema/users";
import { notifications } from "@/db/schema/notifications";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// POST /api/teams/[id]/members — Invite member (coach only)
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
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID gerekli" }, { status: 400 });
    }

    // Check team ownership
    const teamArr = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    if (!teamArr[0] || teamArr[0].coachId !== session.user.id) {
      return NextResponse.json({ error: "Sadece koç üye davet edebilir" }, { status: 403 });
    }

    // Check if already member
    const existing = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, id), eq(teamMembers.userId, userId)))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json({ error: "Kullanıcı zaten takımda" }, { status: 400 });
    }

    await db.insert(teamMembers).values({
      teamId: id,
      userId,
      status: "invited",
    });

    // Send notification
    await db.insert(notifications).values({
      userId,
      type: "team_invite",
      title: "Takım Daveti",
      message: `${teamArr[0].name} takımına davet edildiniz.`,
      data: { teamId: id },
    });

    return NextResponse.json({ message: "Davet gönderildi" }, { status: 201 });
  } catch (error) {
    console.error("Invite member error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/teams/[id]/members — Accept/decline invite
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await req.json();

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
    }

    const membership = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, id),
          eq(teamMembers.userId, session.user.id),
          eq(teamMembers.status, "invited")
        )
      )
      .limit(1);

    if (!membership[0]) {
      return NextResponse.json({ error: "Davet bulunamadı" }, { status: 404 });
    }

    if (action === "accept") {
      await db
        .update(teamMembers)
        .set({ status: "active" })
        .where(eq(teamMembers.id, membership[0].id));
    } else {
      await db
        .update(teamMembers)
        .set({ status: "removed" })
        .where(eq(teamMembers.id, membership[0].id));
    }

    return NextResponse.json({ message: action === "accept" ? "Takıma katıldınız" : "Davet reddedildi" });
  } catch (error) {
    console.error("Member action error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
