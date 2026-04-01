import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { battles } from "@/db/schema/battles";
import { users } from "@/db/schema/users";
import { studios } from "@/db/schema/users";
import { auth } from "@/lib/auth";
import { eq, and, gte, lte, isNotNull, or } from "drizzle-orm";
import { sql } from "drizzle-orm";

// GET /api/judge-schedule?week=2026-04-01
// Returns all battles with judges assigned for the given week
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "judge" && role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    // Parse week start date
    const weekParam = req.nextUrl.searchParams.get("week");
    let weekStart: Date;

    if (weekParam) {
      weekStart = new Date(weekParam);
    } else {
      weekStart = new Date();
    }

    // Normalize to Monday of that week
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Aliases for users table joins
    const challenger = users;
    const opponent = users;
    const judge = users;

    // Get all scheduled/judge_assigned battles for this week
    const result = await db.execute(sql`
      SELECT 
        b.id,
        b.status,
        b.scheduled_date,
        b.dance_style,
        b.judge_id,
        b.studio_id,
        u1.name AS challenger_name,
        u1.surname AS challenger_surname,
        u2.name AS opponent_name,
        u2.surname AS opponent_surname,
        u3.name AS judge_name,
        u3.surname AS judge_surname,
        s.name AS studio_name,
        s.address AS studio_address,
        s.city AS studio_city
      FROM battles b
      LEFT JOIN users u1 ON b.challenger_id = u1.id
      LEFT JOIN users u2 ON b.opponent_id = u2.id
      LEFT JOIN users u3 ON b.judge_id = u3.id
      LEFT JOIN studios s ON b.studio_id = s.id
      WHERE b.scheduled_date >= ${weekStart.toISOString()}
        AND b.scheduled_date < ${weekEnd.toISOString()}
        AND b.status IN ('scheduled', 'judge_assigned', 'studio_approved', 'in_progress', 'completed')
      ORDER BY b.scheduled_date ASC
    `);

    const battles = (result.rows || []).map((r: any) => ({
      id: r.id,
      status: r.status,
      scheduledDate: r.scheduled_date,
      danceStyle: r.dance_style,
      judgeId: r.judge_id,
      judgeName: r.judge_name ? `${r.judge_name} ${r.judge_surname}` : null,
      challengerName: `${r.challenger_name} ${r.challenger_surname}`,
      opponentName: `${r.opponent_name} ${r.opponent_surname}`,
      studioName: r.studio_name,
      studioAddress: r.studio_address,
      studioCity: r.studio_city,
    }));

    // Also return list of judges for admin
    let judges: any[] = [];
    if (role === "admin") {
      const judgeList = await db.execute(sql`
        SELECT id, name, surname, username FROM users WHERE role IN ('judge', 'admin') ORDER BY name ASC
      `);
      judges = (judgeList.rows || []).map((j: any) => ({
        id: j.id,
        name: `${j.name} ${j.surname}`,
        username: j.username,
      }));
    }

    return NextResponse.json({
      battles,
      judges,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    });
  } catch (error) {
    console.error("Judge schedule error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
