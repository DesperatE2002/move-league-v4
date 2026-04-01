"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield,
  Swords,
  MapPin,
  Clock,
  User,
  Gavel,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleBattle {
  id: string;
  status: string;
  scheduledDate: string;
  danceStyle: string | null;
  judgeId: string | null;
  judgeName: string | null;
  challengerName: string;
  opponentName: string;
  studioName: string | null;
  studioAddress: string | null;
  studioCity: string | null;
}

interface JudgeInfo {
  id: string;
  name: string;
  username: string;
}

const DAY_NAMES_TR = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DAY_NAMES_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Color palette for judges
const JUDGE_COLORS = [
  "bg-ml-red/15 border-ml-red/30",
  "bg-blue-500/15 border-blue-500/30",
  "bg-green-500/15 border-green-500/30",
  "bg-purple-500/15 border-purple-500/30",
  "bg-orange-500/15 border-orange-500/30",
  "bg-pink-500/15 border-pink-500/30",
  "bg-cyan-500/15 border-cyan-500/30",
  "bg-yellow-500/15 border-yellow-500/30",
];
const JUDGE_TEXT_COLORS = [
  "text-ml-red",
  "text-blue-400",
  "text-green-400",
  "text-purple-400",
  "text-orange-400",
  "text-pink-400",
  "text-cyan-400",
  "text-yellow-400",
];

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date, isTr: boolean) {
  return d.toLocaleDateString(isTr ? "tr-TR" : "en-US", { day: "numeric", month: "short" });
}

export default function AdminSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const locale = params.locale as string;
  const isTr = locale === "tr";

  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [battles, setBattles] = useState<ScheduleBattle[]>([]);
  const [judges, setJudges] = useState<JudgeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterJudge, setFilterJudge] = useState<string>("all");

  const role = session?.user?.role;

  useEffect(() => {
    fetchSchedule();
  }, [weekStart]);

  async function fetchSchedule() {
    setLoading(true);
    try {
      const res = await fetch(`/api/judge-schedule?week=${weekStart.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setBattles(data.battles || []);
        setJudges(data.judges || []);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }
  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }
  function goToday() {
    setWeekStart(getMondayOfWeek(new Date()));
  }

  // Build judge color map
  const judgeColorMap = new Map<string, number>();
  judges.forEach((j, i) => {
    judgeColorMap.set(j.id, i % JUDGE_COLORS.length);
  });

  function getBattlesForDay(dayIdx: number): ScheduleBattle[] {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + dayIdx);
    const dayStr = dayDate.toISOString().split("T")[0];

    return battles
      .filter((b) => {
        const bDate = new Date(b.scheduledDate).toISOString().split("T")[0];
        if (bDate !== dayStr) return false;
        if (filterJudge === "none" && b.judgeId) return false;
        if (filterJudge !== "all" && filterJudge !== "none" && b.judgeId !== filterJudge) return false;
        return true;
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }

  const dayNames = isTr ? DAY_NAMES_TR : DAY_NAMES_EN;

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${formatDate(weekStart, isTr)} - ${formatDate(weekEnd, isTr)}`;

  // Summary stats
  const totalThisWeek = battles.length;
  const unassigned = battles.filter((b) => !b.judgeId).length;
  const judgesThisWeek = new Set(battles.filter(b => b.judgeId).map(b => b.judgeId)).size;

  if (role !== "admin") {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 text-ml-gray-500 mx-auto mb-4" />
        <p className="text-ml-gray-400">{isTr ? "Yetkisiz erişim" : "Unauthorized"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/${locale}/admin`)}
          className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-hover transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <CalendarDays className="w-5 h-5 text-ml-red" />
        <h1 className="text-xl font-bold text-ml-white">
          {isTr ? "Haftalık Program" : "Weekly Schedule"}
        </h1>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-ml-dark-card rounded-lg border border-ml-dark-border p-3 text-center">
          <p className="text-lg font-bold text-ml-white">{totalThisWeek}</p>
          <p className="text-[10px] text-ml-gray-500">{isTr ? "Toplam Battle" : "Total Battles"}</p>
        </div>
        <div className="bg-ml-dark-card rounded-lg border border-ml-dark-border p-3 text-center">
          <p className="text-lg font-bold text-ml-red">{unassigned}</p>
          <p className="text-[10px] text-ml-gray-500">{isTr ? "Hakem Atanmamış" : "Unassigned"}</p>
        </div>
        <div className="bg-ml-dark-card rounded-lg border border-ml-dark-border p-3 text-center">
          <p className="text-lg font-bold text-ml-info">{judgesThisWeek}</p>
          <p className="text-[10px] text-ml-gray-500">{isTr ? "Aktif Hakem" : "Active Judges"}</p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-ml-dark-card rounded-xl border border-ml-dark-border p-3">
        <button onClick={prevWeek} className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-hover transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-ml-white">{weekLabel}</p>
          <button onClick={goToday} className="text-[10px] text-ml-red hover:text-ml-red/80 transition-all mt-0.5">
            {isTr ? "Bu Hafta" : "This Week"}
          </button>
        </div>
        <button onClick={nextWeek} className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-hover transition-all">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Judge Filter */}
      {judges.length > 0 && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-3.5 h-3.5 text-ml-gray-400" />
            <span className="text-xs text-ml-gray-400 font-medium">
              {isTr ? "Hakem Filtresi" : "Judge Filter"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterJudge("all")}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border transition-all",
                filterJudge === "all"
                  ? "bg-ml-white text-ml-dark border-ml-white"
                  : "text-ml-gray-400 border-ml-dark-border hover:border-ml-gray-500"
              )}
            >
              {isTr ? "Tümü" : "All"}
            </button>
            <button
              onClick={() => setFilterJudge("none")}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border transition-all",
                filterJudge === "none"
                  ? "bg-ml-red text-ml-white border-ml-red"
                  : "text-ml-gray-400 border-ml-dark-border hover:border-ml-gray-500"
              )}
            >
              {isTr ? "Atanmamış" : "Unassigned"}
            </button>
            {judges.map((j) => {
              const colorIdx = judgeColorMap.get(j.id) ?? 0;
              return (
                <button
                  key={j.id}
                  onClick={() => setFilterJudge(j.id)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-full border transition-all",
                    filterJudge === j.id
                      ? `${JUDGE_COLORS[colorIdx]} ${JUDGE_TEXT_COLORS[colorIdx]} font-semibold`
                      : "text-ml-gray-400 border-ml-dark-border hover:border-ml-gray-500"
                  )}
                >
                  {j.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, dayIdx) => {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + dayIdx);
            const dayBattles = getBattlesForDay(dayIdx);
            const isToday = new Date().toISOString().split("T")[0] === dayDate.toISOString().split("T")[0];

            return (
              <div
                key={dayIdx}
                className={cn(
                  "bg-ml-dark-card rounded-xl border overflow-hidden",
                  isToday ? "border-ml-red/40" : "border-ml-dark-border"
                )}
              >
                {/* Day Header */}
                <div className={cn(
                  "flex items-center justify-between px-4 py-2",
                  isToday ? "bg-ml-red/10" : "bg-ml-dark-hover"
                )}>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-bold",
                      isToday ? "text-ml-red" : "text-ml-white"
                    )}>
                      {dayNames[dayIdx]}
                    </span>
                    <span className="text-xs text-ml-gray-400">
                      {formatDate(dayDate, isTr)}
                    </span>
                  </div>
                  {dayBattles.length > 0 && (
                    <span className="text-[10px] font-bold bg-ml-red/20 text-ml-red px-2 py-0.5 rounded-full">
                      {dayBattles.length}
                    </span>
                  )}
                </div>

                {/* Battles */}
                {dayBattles.length === 0 ? (
                  <div className="px-4 py-3">
                    <p className="text-xs text-ml-gray-500 italic">
                      {isTr ? "Bu gün battle yok" : "No battles this day"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-ml-dark-border">
                    {dayBattles.map((b) => {
                      const time = new Date(b.scheduledDate).toLocaleTimeString(isTr ? "tr-TR" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const colorIdx = b.judgeId ? (judgeColorMap.get(b.judgeId) ?? 0) : -1;

                      return (
                        <div
                          key={b.id}
                          className={cn(
                            "px-4 py-3 space-y-1.5",
                            colorIdx >= 0
                              ? JUDGE_COLORS[colorIdx]
                              : "bg-ml-red/5"
                          )}
                        >
                          {/* Time + Style + Status */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-ml-info" />
                              <span className="text-sm font-bold text-ml-white">{time}</span>
                              {b.danceStyle && (
                                <span className="text-[10px] bg-ml-dark-hover text-ml-gray-300 px-1.5 py-0.5 rounded">
                                  {b.danceStyle}
                                </span>
                              )}
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              b.status === "completed" ? "bg-ml-success/20 text-ml-success" :
                              b.status === "judge_assigned" ? "bg-ml-info/20 text-ml-info" :
                              !b.judgeId ? "bg-ml-red/20 text-ml-red" :
                              "bg-ml-gold/20 text-ml-gold"
                            )}>
                              {b.status === "completed" ? (isTr ? "Tamamlandı" : "Done") :
                               !b.judgeId ? (isTr ? "Hakem Yok" : "No Judge") :
                               b.status === "judge_assigned" ? (isTr ? "Hakem Atandı" : "Judge Set") :
                               (isTr ? "Planlandı" : "Scheduled")}
                            </span>
                          </div>

                          {/* Dancers */}
                          <div className="flex items-center gap-1.5">
                            <Swords className="w-3.5 h-3.5 text-ml-red" />
                            <span className="text-xs text-ml-gray-300">
                              {b.challengerName} <span className="text-ml-gray-500">vs</span> {b.opponentName}
                            </span>
                          </div>

                          {/* Judge */}
                          <div className="flex items-center gap-1.5">
                            <Gavel className="w-3.5 h-3.5 text-orange-400" />
                            {b.judgeName ? (
                              <span className={cn(
                                "text-xs font-medium",
                                colorIdx >= 0 ? JUDGE_TEXT_COLORS[colorIdx] : "text-ml-gray-400"
                              )}>
                                {b.judgeName}
                              </span>
                            ) : (
                              <span className="text-xs text-ml-red italic">
                                {isTr ? "Hakem atanmamış" : "No judge assigned"}
                              </span>
                            )}
                          </div>

                          {/* Studio */}
                          {b.studioName && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-ml-success" />
                              <span className="text-xs text-ml-gray-400">
                                {b.studioName}{b.studioCity ? `, ${b.studioCity}` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
