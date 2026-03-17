import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dataDeletionRequests } from "@/db/schema/consents";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// POST /api/users/me/deletion-request — KVKK Article 7: Request data deletion
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { reason } = (await req.json()) as { reason?: string };

    // Check if there's already a pending request
    const existing = await db
      .select()
      .from(dataDeletionRequests)
      .where(
        and(
          eq(dataDeletionRequests.userId, session.user.id),
          eq(dataDeletionRequests.status, "pending")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Zaten bekleyen bir silme talebiniz var" },
        { status: 400 }
      );
    }

    const [request] = await db
      .insert(dataDeletionRequests)
      .values({
        userId: session.user.id,
        reason: reason || null,
      })
      .returning();

    return NextResponse.json(
      { message: "Silme talebiniz alındı. 30 gün içinde işlenecektir.", request },
      { status: 201 }
    );
  } catch (error) {
    console.error("Deletion request error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// GET /api/users/me/deletion-request — Check deletion request status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const requests = await db
      .select()
      .from(dataDeletionRequests)
      .where(eq(dataDeletionRequests.userId, session.user.id));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Get deletion requests error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
