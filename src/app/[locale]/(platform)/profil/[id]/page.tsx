export const dynamic = 'force-dynamic';

import { db } from "@/db";
import { users } from "@/db/schema/users";
import { dancerRatings } from "@/db/schema/seasons";
import { seasons } from "@/db/schema/seasons";
import { userBadges } from "@/db/schema/badges";
import { badges } from "@/db/schema/badges";
import { battles } from "@/db/schema/battles";
import { auth } from "@/lib/auth";
import { eq, and, or, count } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import {
  MapPin,
  Calendar,
  Swords,
  Trophy,
  Medal,
  Star,
  ArrowLeft,
  PauseCircle,
} from "lucide-react";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();
  const t = await getTranslations("profile");

  if (!session?.user?.id) {
    return (
      <div className="text-center py-10">
        <p className="text-ml-gray-400">Yetkisiz erişim</p>
      </div>
    );
  }

  // If viewing own profile, show same page
  const isOwn = session.user.id === id;

  // Get user
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  const user = result[0] ?? null;

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-ml-gray-400">Kullanıcı bulunamadı</p>
      </div>
    );
  }

  // Get stats
  const activeSeasonArr = await db
    .select()
    .from(seasons)
    .where(eq(seasons.isActive, true))
    .limit(1);
  const activeSeason = activeSeasonArr[0] ?? null;

  let rating = 1000;
  let wins = 0;
  let losses = 0;
  let totalBattles = 0;

  if (activeSeason) {
    const ratingArr = await db
      .select()
      .from(dancerRatings)
      .where(
        and(
          eq(dancerRatings.userId, id),
          eq(dancerRatings.seasonId, activeSeason.id)
        )
      );

    if (ratingArr.length > 0) {
      rating = Math.max(...ratingArr.map(r => r.rating ?? 1000));
      wins = ratingArr.reduce((s, r) => s + (r.wins ?? 0), 0);
      losses = ratingArr.reduce((s, r) => s + (r.losses ?? 0), 0);
      totalBattles = ratingArr.reduce((s, r) => s + (r.totalBattles ?? 0), 0);
    }
  }

  // Get badges
  const userBadgeList = await db
    .select({
      id: userBadges.id,
      earnedAt: userBadges.earnedAt,
      nameTr: badges.nameTr,
      nameEn: badges.nameEn,
      iconUrl: badges.iconUrl,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, id));

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Back button */}
      <a
        href={`/${locale}/siralama`}
        className="inline-flex items-center gap-1 text-sm text-ml-gray-400 hover:text-ml-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("title")}
      </a>

      {/* Profile Header */}
      <div className="relative bg-ml-dark-card rounded-2xl border border-ml-dark-border overflow-hidden">
        <div className="h-24 bg-linear-to-r from-ml-red via-ml-red-dark to-ml-dark" />
        <div className="px-4 -mt-10 pb-4">
          <div className="w-20 h-20 rounded-full bg-ml-dark border-4 border-ml-dark-card flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-ml-red">
                {user.name.charAt(0)}
                {user.surname.charAt(0)}
              </span>
            )}
          </div>

          <div className="mt-2">
            <h1 className="text-xl font-bold text-ml-white">
              {user.name} {user.surname}
            </h1>
            <p className="text-sm text-ml-gray-400">@{user.username}</p>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {!user.isActive && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ml-red/10 text-ml-red text-xs font-medium border border-ml-red/20">
                <PauseCircle className="w-3 h-3" />
                {locale === "tr" ? "Pasif" : "Passive"}
              </span>
            )}
            {user.danceStyle && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ml-red/10 text-ml-red text-xs font-medium border border-ml-red/20">
                <Star className="w-3 h-3" />
                {user.danceStyle}
              </span>
            )}
            {user.city && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ml-dark border border-ml-dark-border text-ml-gray-400 text-xs">
                <MapPin className="w-3 h-3" />
                {user.city}
                {user.country && `, ${user.country}`}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ml-dark border border-ml-dark-border text-ml-gray-400 text-xs">
              <Calendar className="w-3 h-3" />
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString(
                    locale === "tr" ? "tr-TR" : "en-US"
                  )
                : ""}
            </span>
          </div>

          {user.bio && (
            <p className="text-sm text-ml-gray-300 mt-3">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 lg:gap-4">
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-3 text-center">
          <Trophy className="w-4 h-4 text-ml-red mx-auto mb-1" />
          <p className="text-lg font-bold text-ml-white">{rating}</p>
          <p className="text-[10px] text-ml-gray-500">{t("rating")}</p>
        </div>
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-3 text-center">
          <Swords className="w-4 h-4 text-ml-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-ml-white">{totalBattles}</p>
          <p className="text-[10px] text-ml-gray-500">{t("totalBattles")}</p>
        </div>
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-3 text-center">
          <div className="w-4 h-4 rounded-full bg-ml-success/20 mx-auto mb-1 flex items-center justify-center">
            <span className="text-[8px] text-ml-success font-bold">W</span>
          </div>
          <p className="text-lg font-bold text-ml-success">{wins}</p>
          <p className="text-[10px] text-ml-gray-500">{t("wins")}</p>
        </div>
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-3 text-center">
          <div className="w-4 h-4 rounded-full bg-ml-error/20 mx-auto mb-1 flex items-center justify-center">
            <span className="text-[8px] text-ml-error font-bold">L</span>
          </div>
          <p className="text-lg font-bold text-ml-error">{losses}</p>
          <p className="text-[10px] text-ml-gray-500">{t("losses")}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Medal className="w-4 h-4 text-ml-gold" />
          <h3 className="text-sm font-semibold text-ml-white">{t("badges")}</h3>
        </div>
        {userBadgeList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {userBadgeList.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ml-gold/10 text-ml-gold text-xs font-medium border border-ml-gold/20"
              >
                {b.iconUrl && (
                  <img src={b.iconUrl} alt="" className="w-3 h-3" />
                )}
                {locale === "tr" ? b.nameTr : b.nameEn}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ml-gray-500">{t("noBadges")}</p>
        )}
      </div>

      {/* Edit Profile Button (only for own profile) */}
      {isOwn && (
        <a
          href={`/${locale}/ayarlar`}
          className="block w-full py-3 text-center bg-ml-dark-card border border-ml-dark-border rounded-xl text-ml-gray-300 font-medium hover:border-ml-red/40 hover:text-ml-red transition-all active:scale-[0.98]"
        >
          {t("editProfile")}
        </a>
      )}
    </div>
  );
}
