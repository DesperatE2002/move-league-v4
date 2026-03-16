"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Trophy, Loader2, TrendingUp, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankedUser {
  rank: number;
  userId: string;
  rating: number;
  wins: number;
  losses: number;
  totalBattles: number;
  peakRating: number;
  name: string;
  surname: string;
  username: string;
  avatarUrl: string | null;
  city: string | null;
  country: string | null;
  danceStyle: string | null;
}

export default function RankingsPage() {
  const t = useTranslations("rankings");
  const tNav = useTranslations("nav");

  const [rankings, setRankings] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  async function fetchRankings() {
    try {
      const res = await fetch("/api/rankings");
      if (res.ok) {
        const data = await res.json();
        setRankings(data.rankings);
      }
    } catch {
      // fail
    } finally {
      setLoading(false);
    }
  }

  const medalColors = ["text-ml-gold", "text-ml-silver", "text-ml-bronze"];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-ml-gold" />
        <h1 className="text-xl font-bold text-ml-white">{tNav("rankings")}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : rankings.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <div className="inline-flex p-4 rounded-full bg-ml-gold/10 mb-4">
            <Trophy className="w-8 h-8 text-ml-gold" />
          </div>
          <h2 className="text-lg font-semibold text-ml-white mb-2">
            {t("noRankings")}
          </h2>
          <p className="text-sm text-ml-gray-400">
            {t("noRankingsDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rankings.map((user) => (
            <div
              key={user.userId}
              className={cn(
                "flex items-center gap-3 p-3 bg-ml-dark-card rounded-xl border transition-all",
                user.rank <= 3
                  ? "border-ml-gold/20"
                  : "border-ml-dark-border"
              )}
            >
              <div className="w-8 text-center">
                {user.rank <= 3 ? (
                  <Medal className={cn("w-5 h-5 mx-auto", medalColors[user.rank - 1])} />
                ) : (
                  <span className="text-sm font-bold text-ml-gray-400">{user.rank}</span>
                )}
              </div>

              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                user.rank === 1 ? "bg-ml-gold/20 text-ml-gold" :
                user.rank === 2 ? "bg-ml-silver/20 text-ml-silver" :
                user.rank === 3 ? "bg-ml-bronze/20 text-ml-bronze" :
                "bg-ml-dark-hover text-ml-gray-400"
              )}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  user.name[0]
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ml-white truncate">
                  {user.name} {user.surname}
                </p>
                <p className="text-xs text-ml-gray-400 truncate">
                  @{user.username}
                  {user.city && ` · ${user.city}`}
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <TrendingUp className="w-3 h-3 text-ml-red" />
                  <span className="text-sm font-bold text-ml-white">{user.rating}</span>
                </div>
                <p className="text-xs text-ml-gray-500">
                  {user.wins}W {user.losses}L
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
