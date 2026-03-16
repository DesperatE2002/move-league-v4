import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workshopMessages, workshops, workshopEnrollments } from "@/db/schema/workshops";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, and, or, desc, sql } from "drizzle-orm";

// GET /api/workshops/[id]/messages — Get messages for a workshop between current user and coach
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id: workshopId } = await params;
    const userId = session.user.id;

    // Get workshop to find coach
    const [workshop] = await db
      .select({ coachId: workshops.coachId })
      .from(workshops)
      .where(eq(workshops.id, workshopId))
      .limit(1);

    if (!workshop) {
      return NextResponse.json({ error: "Atölye bulunamadı" }, { status: 404 });
    }

    const isCoach = userId === workshop.coachId;

    // If user is the coach, get partner from query param
    const partnerId = isCoach
      ? new URL(req.url).searchParams.get("partnerId")
      : workshop.coachId;

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID gerekli" }, { status: 400 });
    }

    const messages = await db
      .select({
        id: workshopMessages.id,
        senderId: workshopMessages.senderId,
        receiverId: workshopMessages.receiverId,
        message: workshopMessages.message,
        createdAt: workshopMessages.createdAt,
        senderName: users.name,
        senderSurname: users.surname,
      })
      .from(workshopMessages)
      .innerJoin(users, eq(workshopMessages.senderId, users.id))
      .where(
        and(
          eq(workshopMessages.workshopId, workshopId),
          or(
            and(eq(workshopMessages.senderId, userId), eq(workshopMessages.receiverId, partnerId)),
            and(eq(workshopMessages.senderId, partnerId), eq(workshopMessages.receiverId, userId))
          )
        )
      )
      .orderBy(workshopMessages.createdAt)
      .limit(100);

    // If coach, also return list of enrolled users who have messages
    let enrolledUsers: { userId: string; name: string; surname: string; username: string }[] = [];
    if (isCoach) {
      enrolledUsers = await db
        .select({
          userId: users.id,
          name: users.name,
          surname: users.surname,
          username: users.username,
        })
        .from(workshopEnrollments)
        .innerJoin(users, eq(workshopEnrollments.userId, users.id))
        .where(
          and(
            eq(workshopEnrollments.workshopId, workshopId),
            eq(workshopEnrollments.status, "enrolled")
          )
        );
    }

    return NextResponse.json({ messages, enrolledUsers, isCoach });
  } catch (error) {
    console.error("Get workshop messages error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/workshops/[id]/messages — Send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id: workshopId } = await params;
    const userId = session.user.id;
    const body = await req.json();
    const message = body.message?.trim();

    if (!message || message.length > 2000) {
      return NextResponse.json({ error: "Geçersiz mesaj" }, { status: 400 });
    }

    // Get workshop
    const [workshop] = await db
      .select({ coachId: workshops.coachId, type: workshops.type })
      .from(workshops)
      .where(eq(workshops.id, workshopId))
      .limit(1);

    if (!workshop) {
      return NextResponse.json({ error: "Atölye bulunamadı" }, { status: 404 });
    }

    const isCoach = userId === workshop.coachId;

    // Determine receiver
    let receiverId: string;
    if (isCoach) {
      receiverId = body.receiverId;
      if (!receiverId) {
        return NextResponse.json({ error: "Alıcı ID gerekli" }, { status: 400 });
      }
    } else {
      // Check enrollment
      const [enrollment] = await db
        .select({ id: workshopEnrollments.id })
        .from(workshopEnrollments)
        .where(
          and(
            eq(workshopEnrollments.workshopId, workshopId),
            eq(workshopEnrollments.userId, userId),
            eq(workshopEnrollments.status, "enrolled")
          )
        )
        .limit(1);

      if (!enrollment) {
        return NextResponse.json({ error: "Bu atölyeye kayıtlı değilsiniz" }, { status: 403 });
      }
      receiverId = workshop.coachId;
    }

    const [msg] = await db
      .insert(workshopMessages)
      .values({
        workshopId,
        senderId: userId,
        receiverId,
        message,
      })
      .returning();

    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    console.error("Send workshop message error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
