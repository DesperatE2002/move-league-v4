import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { userConsents } from "@/db/schema/consents";
import { userBadges, badges } from "@/db/schema/badges";
import { battles, battleScores } from "@/db/schema/battles";
import { workshops, workshopEnrollments, workshopReviews, workshopMessages } from "@/db/schema/workshops";
import { teams, teamMembers, competitionRegistrations } from "@/db/schema/teams";
import { dancerRatings } from "@/db/schema/seasons";
import { notifications } from "@/db/schema/notifications";
import { auth } from "@/lib/auth";
import { eq, or } from "drizzle-orm";

// GET /api/users/me/data-export — KVKK Article 11: User data export
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const userId = session.user.id;

    // User profile
    const [profile] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        surname: users.surname,
        username: users.username,
        role: users.role,
        city: users.city,
        country: users.country,
        gender: users.gender,
        danceStyle: users.danceStyle,
        bio: users.bio,
        language: users.language,
        kvkkConsent: users.kvkkConsent,
        termsConsent: users.termsConsent,
        marketingConsent: users.marketingConsent,
        consentAt: users.consentAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Consent history
    const consents = await db
      .select()
      .from(userConsents)
      .where(eq(userConsents.userId, userId));

    // Badges
    const myBadges = await db
      .select({
        badgeKey: badges.key,
        badgeNameTr: badges.nameTr,
        badgeNameEn: badges.nameEn,
        earnedAt: userBadges.earnedAt,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId));

    // Battles (as challenger or opponent)
    const myBattles = await db
      .select({
        id: battles.id,
        status: battles.status,
        danceStyle: battles.danceStyle,
        challengerId: battles.challengerId,
        opponentId: battles.opponentId,
        winnerId: battles.winnerId,
        challengerScore: battles.challengerScore,
        opponentScore: battles.opponentScore,
        ratingChange: battles.ratingChange,
        scheduledDate: battles.scheduledDate,
        createdAt: battles.createdAt,
      })
      .from(battles)
      .where(or(eq(battles.challengerId, userId), eq(battles.opponentId, userId)));

    // Dancer ratings
    const myRatings = await db
      .select()
      .from(dancerRatings)
      .where(eq(dancerRatings.userId, userId));

    // Workshop enrollments
    const myEnrollments = await db
      .select({
        workshopId: workshopEnrollments.workshopId,
        status: workshopEnrollments.status,
        enrolledAt: workshopEnrollments.enrolledAt,
        completedAt: workshopEnrollments.completedAt,
      })
      .from(workshopEnrollments)
      .where(eq(workshopEnrollments.userId, userId));

    // Workshop reviews
    const myReviews = await db
      .select({
        workshopId: workshopReviews.workshopId,
        rating: workshopReviews.rating,
        comment: workshopReviews.comment,
        createdAt: workshopReviews.createdAt,
      })
      .from(workshopReviews)
      .where(eq(workshopReviews.userId, userId));

    // Workshop messages (sent)
    const myMessages = await db
      .select({
        workshopId: workshopMessages.workshopId,
        receiverId: workshopMessages.receiverId,
        message: workshopMessages.message,
        createdAt: workshopMessages.createdAt,
      })
      .from(workshopMessages)
      .where(eq(workshopMessages.senderId, userId));

    // Team memberships
    const myTeams = await db
      .select({
        teamId: teamMembers.teamId,
        status: teamMembers.status,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));

    // Notifications (last 200)
    const myNotifications = await db
      .select({
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .limit(200);

    const exportData = {
      exportDate: new Date().toISOString(),
      exportReason: "KVKK Madde 11 - Kişisel verilere erişim hakkı",
      profile,
      consentHistory: consents.map((c) => ({
        type: c.consentType,
        action: c.action,
        version: c.version,
        ipAddress: c.ipAddress,
        date: c.createdAt,
      })),
      badges: myBadges,
      battles: myBattles,
      ratings: myRatings.map((r) => ({
        seasonId: r.seasonId,
        rating: r.rating,
        wins: r.wins,
        losses: r.losses,
        draws: r.draws,
        totalBattles: r.totalBattles,
        peakRating: r.peakRating,
      })),
      workshopEnrollments: myEnrollments,
      workshopReviews: myReviews,
      workshopMessages: myMessages,
      teamMemberships: myTeams,
      notifications: myNotifications,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="move-league-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
