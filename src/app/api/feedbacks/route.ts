import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedbacks } from "@/db/schema/feedbacks";
import { users } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// GET /api/feedbacks — admin: list all, user: list own
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";

    if (isAdmin) {
      const list = await db
        .select({
          id: feedbacks.id,
          userId: feedbacks.userId,
          category: feedbacks.category,
          title: feedbacks.title,
          description: feedbacks.description,
          overallRating: feedbacks.overallRating,
          easeOfUse: feedbacks.easeOfUse,
          battleSystemRating: feedbacks.battleSystemRating,
          workshopRating: feedbacks.workshopRating,
          designRating: feedbacks.designRating,
          mostLikedFeature: feedbacks.mostLikedFeature,
          mostDislikedFeature: feedbacks.mostDislikedFeature,
          missingFeature: feedbacks.missingFeature,
          deviceInfo: feedbacks.deviceInfo,
          browserInfo: feedbacks.browserInfo,
          status: feedbacks.status,
          adminNote: feedbacks.adminNote,
          createdAt: feedbacks.createdAt,
          userName: users.name,
          userSurname: users.surname,
          userUsername: users.username,
        })
        .from(feedbacks)
        .leftJoin(users, eq(feedbacks.userId, users.id))
        .orderBy(desc(feedbacks.createdAt));

      return NextResponse.json({ feedbacks: list });
    }

    // Regular user: own feedbacks
    const list = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.userId, session.user.id))
      .orderBy(desc(feedbacks.createdAt));

    return NextResponse.json({ feedbacks: list });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/feedbacks — submit feedback
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      category,
      title,
      description,
      overallRating,
      easeOfUse,
      battleSystemRating,
      workshopRating,
      designRating,
      mostLikedFeature,
      mostDislikedFeature,
      missingFeature,
    } = body;

    if (!category || !title || !description || !overallRating || !easeOfUse) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (overallRating < 1 || overallRating > 5 || easeOfUse < 1 || easeOfUse > 5) {
      return NextResponse.json({ error: "Ratings must be 1-5" }, { status: 400 });
    }

    // Auto-detect device/browser
    const ua = req.headers.get("user-agent") || "";
    let deviceInfo = "Unknown";
    if (/mobile|android|iphone|ipad/i.test(ua)) deviceInfo = "Mobile";
    else if (/tablet/i.test(ua)) deviceInfo = "Tablet";
    else deviceInfo = "Desktop";

    const [created] = await db
      .insert(feedbacks)
      .values({
        userId: session.user.id,
        category,
        title: String(title).slice(0, 300),
        description: String(description).slice(0, 5000),
        overallRating: Math.min(5, Math.max(1, Number(overallRating))),
        easeOfUse: Math.min(5, Math.max(1, Number(easeOfUse))),
        battleSystemRating: battleSystemRating ? Math.min(5, Math.max(1, Number(battleSystemRating))) : null,
        workshopRating: workshopRating ? Math.min(5, Math.max(1, Number(workshopRating))) : null,
        designRating: designRating ? Math.min(5, Math.max(1, Number(designRating))) : null,
        mostLikedFeature: mostLikedFeature ? String(mostLikedFeature).slice(0, 2000) : null,
        mostDislikedFeature: mostDislikedFeature ? String(mostDislikedFeature).slice(0, 2000) : null,
        missingFeature: missingFeature ? String(missingFeature).slice(0, 2000) : null,
        deviceInfo,
        browserInfo: ua.slice(0, 300),
      })
      .returning();

    return NextResponse.json({ feedback: created });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/feedbacks — admin: update status/note
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, adminNote } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (adminNote !== undefined) updates.adminNote = String(adminNote).slice(0, 2000);

    await db.update(feedbacks).set(updates).where(eq(feedbacks.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
