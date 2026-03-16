"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Trophy, Loader2, TrendingUp, Medal, Filter, X } from "lucide-react";
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
  const [showFilters, setShowFilters] = useState(false);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");

  useEffect(() => {
    fetchRankings();
  }, []);

  async function fetchRankings(country?: string, city?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (country) params.set("country", country);
      if (city) params.set("city", city);
      const qs = params.toString();
      const res = await fetch(`/api/rankings${qs ? `?${qs}` : ""}`);
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

  function applyFilters() {
    fetchRankings(filterCountry || undefined, filterCity || undefined);
    setShowFilters(false);
  }

  function clearFilters() {
    setFilterCountry("");
    setFilterCity("");
    fetchRankings();
    setShowFilters(false);
  }

  const hasActiveFilters = filterCountry || filterCity;

  const medalColors = ["text-ml-gold", "text-ml-silver", "text-ml-bronze"];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-ml-gold" />
          <h1 className="text-xl font-bold text-ml-white">{tNav("rankings")}</h1>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "p-2 rounded-lg transition-all",
            hasActiveFilters
              ? "bg-ml-red/20 text-ml-red"
              : "bg-ml-dark-card text-ml-gray-400 hover:text-ml-white"
          )}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ml-white">{t("filters")}</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-ml-red flex items-center gap-1">
                <X className="w-3 h-3" /> {t("clearFilters")}
              </button>
            )}
          </div>
          <input
            type="text"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            placeholder={t("filterCountry")}
            className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-gold/40"
          />
          <input
            type="text"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            placeholder={t("filterCity")}
            className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-gold/40"
          />
          <button
            onClick={applyFilters}
            className="w-full py-2 bg-ml-gold hover:bg-ml-gold/80 text-black font-semibold rounded-lg text-sm"
          >
            {t("applyFilters")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-gold animate-spin" />
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
        <>
          {/* Top 3 Podium */}
          {rankings.length >= 3 && (
            <div className="flex items-end justify-center gap-3 pt-4 pb-2">
              {/* 2nd place */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-ml-silver/20 border-2 border-ml-silver/40 flex items-center justify-center mb-1">
                  {rankings[1].avatarUrl ? (
                    <img src={rankings[1].avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-ml-silver">{rankings[1].name[0]}</span>
                  )}
                </div>
                <Medal className="w-5 h-5 text-ml-silver mb-0.5" />
                <p className="text-xs font-semibold text-ml-white truncate max-w-20 text-center">{rankings[1].name}</p>
                <p className="text-sm font-bold text-ml-silver">{rankings[1].rating}</p>
                <div className="w-20 h-16 bg-ml-silver/10 rounded-t-lg border border-ml-silver/20 border-b-0 mt-1 flex items-center justify-center">
                  <span className="text-2xl font-black text-ml-silver/40">2</span>
                </div>
              </div>

              {/* 1st place */}
              <div className="flex flex-col items-center -mt-4">
                <div className="w-18 h-18 rounded-full bg-ml-gold/20 border-2 border-ml-gold/40 flex items-center justify-center mb-1 w-[72px] h-[72px]">
                  {rankings[0].avatarUrl ? (
                    <img src={rankings[0].avatarUrl} alt="" className="w-[72px] h-[72px] rounded-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-ml-gold">{rankings[0].name[0]}</span>
                  )}
                </div>
                <Medal className="w-6 h-6 text-ml-gold mb-0.5" />
                <p className="text-xs font-semibold text-ml-white truncate max-w-24 text-center">{rankings[0].name}</p>
                <p className="text-base font-bold text-ml-gold">{rankings[0].rating}</p>
                <div className="w-20 h-24 bg-ml-gold/10 rounded-t-lg border border-ml-gold/20 border-b-0 mt-1 flex items-center justify-center">
                  <span className="text-3xl font-black text-ml-gold/40">1</span>
                </div>
              </div>

              {/* 3rd place */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-[#CD7F32]/20 border-2 border-[#CD7F32]/40 flex items-center justify-center mb-1">
                  {rankings[2].avatarUrl ? (
                    <img src={rankings[2].avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-[#CD7F32]">{rankings[2].name[0]}</span>
                  )}
                </div>
                <Medal className="w-5 h-5 text-[#CD7F32] mb-0.5" />
                <p className="text-xs font-semibold text-ml-white truncate max-w-20 text-center">{rankings[2].name}</p>
                <p className="text-sm font-bold text-[#CD7F32]">{rankings[2].rating}</p>
                <div className="w-20 h-12 bg-[#CD7F32]/10 rounded-t-lg border border-[#CD7F32]/20 border-b-0 mt-1 flex items-center justify-center">
                  <span className="text-xl font-black text-[#CD7F32]/40">3</span>
                </div>
              </div>
            </div>
          )}

          {/* Rankings Table */}
          <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[40px_1fr_60px_80px] lg:grid-cols-[50px_1fr_80px_80px_100px] items-center px-3 py-2.5 border-b border-ml-dark-border bg-ml-dark/50 text-[10px] font-semibold text-ml-gray-500 uppercase tracking-wider">
              <span className="text-center">#</span>
              <span>{t("dancer")}</span>
              <span className="text-center hidden lg:block">{t("record")}</span>
              <span className="text-center">{t("wl")}</span>
              <span className="text-right">{t("ratingLabel")}</span>
            </div>

            {/* Table rows */}
            {rankings.map((user, i) => (
              <div
                key={user.userId}
                className={cn(
                  "grid grid-cols-[40px_1fr_60px_80px] lg:grid-cols-[50px_1fr_80px_80px_100px] items-center px-3 py-2.5 transition-colors hover:bg-ml-dark-hover",
                  i < rankings.length - 1 && "border-b border-ml-dark-border/50",
                  user.rank === 1 && "bg-ml-gold/[0.03]",
                  user.rank === 2 && "bg-ml-silver/[0.03]",
                  user.rank === 3 && "bg-[#CD7F32]/[0.03]"
                )}
              >
                {/* Rank */}
                <div className="text-center">
                  {user.rank <= 3 ? (
                    <Medal className={cn("w-4 h-4 mx-auto", medalColors[user.rank - 1])} />
                  ) : (
                    <span className="text-xs font-bold text-ml-gray-500">{user.rank}</span>
                  )}
                </div>

                {/* Player */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    user.rank === 1 ? "bg-ml-gold/20 text-ml-gold ring-1 ring-ml-gold/30" :
                    user.rank === 2 ? "bg-ml-silver/20 text-ml-silver ring-1 ring-ml-silver/30" :
                    user.rank === 3 ? "bg-[#CD7F32]/20 text-[#CD7F32] ring-1 ring-[#CD7F32]/30" :
                    "bg-ml-dark-hover text-ml-gray-400"
                  )}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      user.name[0]
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ml-white truncate">
                      {user.name} {user.surname}
                    </p>
                    <p className="text-[10px] text-ml-gray-500 truncate">
                      @{user.username}{user.city ? ` · ${user.city}` : ""}
                    </p>
                  </div>
                </div>

                {/* Total Battles (desktop only) */}
                <div className="text-center hidden lg:block">
                  <span className="text-xs text-ml-gray-400">{user.totalBattles}</span>
                </div>

                {/* W/L */}
                <div className="text-center">
                  <span className="text-xs">
                    <span className="text-ml-success font-medium">{user.wins}</span>
                    <span className="text-ml-gray-600 mx-0.5">/</span>
                    <span className="text-ml-red font-medium">{user.losses}</span>
                  </span>
                </div>

                {/* Rating */}
                <div className="text-right">
                  <span className={cn(
                    "text-sm font-bold",
                    user.rank === 1 ? "text-ml-gold" :
                    user.rank === 2 ? "text-ml-silver" :
                    user.rank === 3 ? "text-[#CD7F32]" :
                    "text-ml-white"
                  )}>
                    {user.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
