export const dynamic = 'force-dynamic';

import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Swords, Trophy, GraduationCap, Users, TrendingUp, Flame, Shield } from "lucide-react";
import { db } from "@/db";
import { dancerRatings, seasons } from "@/db/schema/seasons";
import { userBadges } from "@/db/schema/badges";
import { battles } from "@/db/schema/battles";
import { eq, and, or, count } from "drizzle-orm";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  const userId = session?.user?.id;

  // Fetch real stats
  let rating = 1000;
  let battleCount = 0;
  let badgeCount = 0;
  let seasonName: string | null = null;
  let seasonEnd: string | null = null;

  if (userId) {
    const [activeSeasonArr, badgeCountArr, battleCountArr1, battleCountArr2] = await Promise.all([
      db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1),
      db.select({ count: count() }).from(userBadges).where(eq(userBadges.userId, userId)),
      db.select({ count: count() }).from(battles).where(eq(battles.challengerId, userId)),
      db.select({ count: count() }).from(battles).where(eq(battles.opponentId, userId)),
    ]);

    badgeCount = badgeCountArr[0]?.count ?? 0;
    battleCount = (battleCountArr1[0]?.count ?? 0) + (battleCountArr2[0]?.count ?? 0);

    const activeSeason = activeSeasonArr[0];
    if (activeSeason) {
      seasonName = activeSeason.name;
      seasonEnd = activeSeason.endDate;
      const ratingArr = await db
        .select()
        .from(dancerRatings)
        .where(and(eq(dancerRatings.userId, userId), eq(dancerRatings.seasonId, activeSeason.id)));
      if (ratingArr.length > 0) {
        rating = Math.max(...ratingArr.map(r => r.rating ?? 1000));
      }
    }
  }

  const quickActions = [
    {
      title: t("startBattle"),
      icon: <Swords className="w-6 h-6" />,
      href: `/${locale}/duellolar`,
      color: "from-ml-red to-ml-red-dark",
    },
    {
      title: t("viewRankings"),
      icon: <Trophy className="w-6 h-6" />,
      href: `/${locale}/siralama`,
      color: "from-ml-gold/80 to-ml-gold/40",
    },
    {
      title: tNav("workshops"),
      icon: <GraduationCap className="w-6 h-6" />,
      href: `/${locale}/atolyeler`,
      color: "from-ml-info to-blue-700",
    },
    {
      title: tNav("teams"),
      icon: <Users className="w-6 h-6" />,
      href: `/${locale}/takimlar`,
      color: "from-purple-500 to-purple-700",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-ml-red/20 via-ml-dark to-ml-dark border border-ml-red/20 p-5">
        <div className="relative z-10">
          <h1 className="text-xl font-bold text-ml-white">
            {t("welcome")}, {session?.user?.name}! 👋
          </h1>
          <p className="text-sm text-ml-gray-400 mt-1">{t("subtitle")}</p>
        </div>
        <Flame className="absolute -right-2 -top-2 w-24 h-24 text-ml-red/10" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-3 text-center">
          <p className="text-2xl font-bold text-ml-red">{rating}</p>
          <p className="text-xs text-ml-gray-500">Rating</p>
        </div>
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-3 text-center">
          <p className="text-2xl font-bold text-ml-white">{battleCount}</p>
          <p className="text-xs text-ml-gray-500">Düello</p>
        </div>
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-3 text-center">
          <p className="text-2xl font-bold text-ml-gold">{badgeCount}</p>
          <p className="text-xs text-ml-gray-500">Rozet</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-ml-white mb-3">
          {t("quickActions")}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <a
              key={action.title}
              href={action.href}
              className="group relative overflow-hidden rounded-xl bg-ml-dark-card border border-ml-dark-border p-4 transition-all duration-200 hover:border-ml-red/40 hover:shadow-lg hover:shadow-ml-red/5 active:scale-[0.98]"
            >
              <div
                className={`inline-flex p-2.5 rounded-lg bg-linear-to-br ${action.color} text-white mb-2`}
              >
                {action.icon}
              </div>
              <p className="text-sm font-medium text-ml-white">
                {action.title}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* Admin Link */}
      {session?.user?.role === "admin" && (
        <a
          href={`/${locale}/admin`}
          className="flex items-center gap-3 p-4 bg-ml-dark-card rounded-xl border border-ml-red/20 hover:border-ml-red/40 transition-all"
        >
          <div className="p-2.5 rounded-lg bg-linear-to-br from-ml-red to-red-800 text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ml-white">{tNav("admin")}</p>
            <p className="text-xs text-ml-gray-400">{t("adminDesc")}</p>
          </div>
        </a>
      )}

      {/* Season Info */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-ml-red" />
          <h3 className="text-sm font-semibold text-ml-white">Aktif Sezon</h3>
        </div>
        {seasonName ? (
          <div>
            <p className="text-sm font-medium text-ml-gold">{seasonName}</p>
            {seasonEnd && (
              <p className="text-xs text-ml-gray-400 mt-1">
                Bitiş: {new Date(seasonEnd).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-ml-gray-400">
            Henüz aktif sezon bulunmuyor. Admin tarafından sezon başlatıldığında burada gösterilecek.
          </p>
        )}
      </div>
    </div>
  );
}
