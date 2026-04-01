"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

const DAY_NAMES_TR = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DAY_NAMES_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAY_SHORT_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

export default function JudgeSchedulePage() {
  const params = useParams();
  const { data: session } = useSession();
  const locale = params.locale as string;
  const isTr = locale === "tr";

  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [battles, setBattles] = useState<ScheduleBattle[]>([]);
  const [loading, setLoading] = useState(true);

  const role = session?.user?.role;
  const userId = session?.user?.id;

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
      }
    } catch {
      // fail
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

  // Group battles by day index (0=Monday .. 6=Sunday)
  function getBattlesForDay(dayIdx: number): ScheduleBattle[] {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + dayIdx);
    const dayStr = dayDate.toISOString().split("T")[0];

    return battles.filter((b) => {
      const bDate = new Date(b.scheduledDate).toISOString().split("T")[0];
      return bDate === dayStr;
    });
  }

  const dayNames = isTr ? DAY_NAMES_TR : DAY_NAMES_EN;
  const dayShort = isTr ? DAY_SHORT_TR : DAY_SHORT_EN;

  // Week range label
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${formatDate(weekStart, isTr)} - ${formatDate(weekEnd, isTr)}`;

  if (role !== "judge" && role !== "admin") {
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
      <div className="flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-ml-red" />
        <h1 className="text-xl font-bold text-ml-white">
          {isTr ? "Haftalık Program" : "Weekly Schedule"}
        </h1>
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
                      {dayBattles.length} {isTr ? "battle" : "battle"}
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
                      const isMyBattle = b.judgeId === userId;

                      return (
                        <div
                          key={b.id}
                          className={cn(
                            "px-4 py-3 space-y-1.5",
                            isMyBattle && "bg-ml-red/5"
                          )}
                        >
                          {/* Time + Style */}
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
                              "bg-ml-gold/20 text-ml-gold"
                            )}>
                              {b.status === "completed" ? (isTr ? "Tamamlandı" : "Done") :
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
                          {b.judgeName && (
                            <div className="flex items-center gap-1.5">
                              <Gavel className="w-3.5 h-3.5 text-orange-400" />
                              <span className={cn(
                                "text-xs",
                                isMyBattle ? "text-ml-red font-semibold" : "text-ml-gray-400"
                              )}>
                                {b.judgeName}
                                {isMyBattle && (isTr ? " (Sen)" : " (You)")}
                              </span>
                            </div>
                          )}

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
