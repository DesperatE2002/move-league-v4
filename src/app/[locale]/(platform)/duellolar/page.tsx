"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Swords,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trophy,
  CalendarDays,
  Building2,
  ChevronLeft,
  ChevronRight,
  Music,
  MapPin,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BattleUser {
  name: string;
  surname: string;
  username: string;
  avatarUrl: string | null;
}

interface Battle {
  id: string;
  challengerId: string;
  opponentId: string;
  status: string;
  scheduledDate: string | null;
  danceStyle: string | null;
  challengerScore: number | null;
  opponentScore: number | null;
  winnerId: string | null;
  ratingChange: number | null;
  createdAt: string;
  challenger: BattleUser | null;
  opponent: BattleUser | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Bekliyor", color: "text-ml-warning", icon: <Clock className="w-3.5 h-3.5" /> },
  accepted: { label: "Kabul Edildi", color: "text-ml-info", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  declined: { label: "Reddedildi", color: "text-ml-gray-500", icon: <XCircle className="w-3.5 h-3.5" /> },
  studio_pending: { label: "Stüdyo Bekleniyor", color: "text-ml-warning", icon: <Clock className="w-3.5 h-3.5" /> },
  studio_approved: { label: "Stüdyo Onayladı", color: "text-ml-success", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  studio_rejected: { label: "Stüdyo Reddetti", color: "text-ml-gray-500", icon: <XCircle className="w-3.5 h-3.5" /> },
  scheduled: { label: "Planlandı", color: "text-ml-info", icon: <Clock className="w-3.5 h-3.5" /> },
  judge_assigned: { label: "Hakem Atandı", color: "text-purple-400", icon: <Swords className="w-3.5 h-3.5" /> },
  in_progress: { label: "Devam Ediyor", color: "text-ml-info", icon: <Swords className="w-3.5 h-3.5" /> },
  completed: { label: "Tamamlandı", color: "text-ml-success", icon: <Trophy className="w-3.5 h-3.5" /> },
  cancelled: { label: "İptal", color: "text-ml-gray-500", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function BattlesPage() {
  const t = useTranslations("nav");
  const tBattle = useTranslations("battles");
  const tStudio = useTranslations("studioBattles");
  const params = useParams();
  const locale = params.locale as string;
  const { data: session } = useSession();

  const isStudio = session?.user?.role === "studio";

  if (isStudio) {
    return <StudioBattlesView locale={locale} t={t} tBattle={tBattle} tStudio={tStudio} />;
  }

  return <DancerBattlesView locale={locale} t={t} tBattle={tBattle} />;
}

// ─── Dancer View ────────────────────────────────────────────
function DancerBattlesView({ locale, t, tBattle }: { locale: string; t: ReturnType<typeof useTranslations>; tBattle: ReturnType<typeof useTranslations> }) {
  const { data: session } = useSession();
  const isJudge = session?.user?.role === "judge";

  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchBattles();
  }, []);

  async function fetchBattles() {
    try {
      const res = await fetch("/api/battles");
      if (res.ok) {
        const data = await res.json();
        setBattles(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  const filteredBattles = filter === "all"
    ? battles
    : battles.filter((b) => b.status === filter);

  const filters = [
    { key: "all", label: tBattle("all") },
    { key: "pending", label: tBattle("pending") },
    { key: "accepted", label: tBattle("accepted") },
    { key: "completed", label: tBattle("completed") },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ml-white">{t("battles")}</h1>
        {!isJudge && (
          <a
            href={`/${locale}/duellolar/yeni`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-ml-red hover:bg-ml-red-light text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-ml-red/20 active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            {tBattle("newBattle")}
          </a>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              filter === f.key
                ? "bg-ml-red text-white"
                : "bg-ml-dark-card text-ml-gray-400 border border-ml-dark-border hover:border-ml-red/40"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Battle List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : filteredBattles.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <div className="inline-flex p-4 rounded-full bg-ml-red/10 mb-4">
            <Swords className="w-8 h-8 text-ml-red" />
          </div>
          <h2 className="text-lg font-semibold text-ml-white mb-2">
            {tBattle("noBattles")}
          </h2>
          <p className="text-sm text-ml-gray-400 mb-4">
            {tBattle("noBattlesDesc")}
          </p>
          {!isJudge && (
            <a
              href={`/${locale}/duellolar/yeni`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-ml-red hover:bg-ml-red-light text-white text-sm font-semibold rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              {tBattle("newBattle")}
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {filteredBattles.map((battle) => (
            <BattleCard key={battle.id} battle={battle} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Studio View ────────────────────────────────────────────
type StudioTab = "pending" | "manage" | "schedule";

function StudioBattlesView({ locale, t, tBattle, tStudio }: {
  locale: string;
  t: ReturnType<typeof useTranslations>;
  tBattle: ReturnType<typeof useTranslations>;
  tStudio: ReturnType<typeof useTranslations>;
}) {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [studioName, setStudioName] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StudioTab>("pending");
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetchStudioBattles();
  }, []);

  async function fetchStudioBattles() {
    try {
      const res = await fetch("/api/studios/battles");
      if (res.ok) {
        const data = await res.json();
        setBattles(data.battles || []);
        setStudioName(data.studio?.name || "");
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  // Categorize battles
  const pendingBattles = battles.filter((b) => b.status === "studio_pending");
  const manageBattles = battles.filter((b) =>
    ["studio_approved", "scheduled", "judge_assigned", "in_progress"].includes(b.status)
  );
  const allScheduled = battles.filter(
    (b) => b.scheduledDate && !["studio_rejected", "cancelled", "declined"].includes(b.status)
  );

  // Weekly schedule logic
  const getWeekDates = (offset: number) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + offset * 7); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDates(weekOffset);
  const weekStart = weekDays[0];
  const weekEnd = new Date(weekDays[6]);
  weekEnd.setHours(23, 59, 59, 999);

  const weekBattles = allScheduled.filter((b) => {
    const d = new Date(b.scheduledDate!);
    return d >= weekStart && d <= weekEnd;
  });

  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  const tabs = [
    { key: "pending" as StudioTab, label: tStudio("pendingTab"), count: pendingBattles.length },
    { key: "manage" as StudioTab, label: tStudio("manageTab"), count: manageBattles.length },
    { key: "schedule" as StudioTab, label: tStudio("scheduleTab"), count: 0 },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-ml-red/10">
          <Building2 className="w-5 h-5 text-ml-red" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ml-white">{tStudio("title")}</h1>
          {studioName && (
            <p className="text-xs text-ml-gray-400">{studioName}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
              tab === t.key
                ? "bg-ml-red text-white"
                : "bg-ml-dark-card text-ml-gray-400 border border-ml-dark-border hover:border-ml-red/40"
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                tab === t.key ? "bg-white/20" : "bg-ml-red/20 text-ml-red"
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : (
        <>
          {/* Pending Approvals */}
          {tab === "pending" && (
            <div className="space-y-3">
              {pendingBattles.length === 0 ? (
                <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
                  <div className="inline-flex p-4 rounded-full bg-ml-success/10 mb-4">
                    <CheckCircle className="w-8 h-8 text-ml-success" />
                  </div>
                  <h2 className="text-lg font-semibold text-ml-white mb-2">
                    {tStudio("noPending")}
                  </h2>
                  <p className="text-sm text-ml-gray-400">
                    {tStudio("noPendingDesc")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingBattles.map((battle) => (
                    <a
                      key={battle.id}
                      href={`/${locale}/duellolar/${battle.id}`}
                      className="block bg-ml-dark-card rounded-xl border border-ml-warning/30 p-4 hover:border-ml-warning/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-ml-warning">
                          <Clock className="w-3.5 h-3.5" />
                          {tStudio("awaitingApproval")}
                        </div>
                        <span className="text-xs text-ml-gray-500">
                          {new Date(battle.createdAt).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                      <BattleParticipants battle={battle} />
                      {battle.danceStyle && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-ml-gray-400">
                          <Music className="w-3 h-3" />
                          {battle.danceStyle}
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-ml-dark-border">
                        <p className="text-xs text-ml-warning text-center font-medium">
                          {tStudio("tapToApprove")}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manage Battles */}
          {tab === "manage" && (
            <div className="space-y-3">
              {manageBattles.length === 0 ? (
                <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
                  <div className="inline-flex p-4 rounded-full bg-ml-red/10 mb-4">
                    <Swords className="w-8 h-8 text-ml-red" />
                  </div>
                  <h2 className="text-lg font-semibold text-ml-white mb-2">
                    {tStudio("noManage")}
                  </h2>
                  <p className="text-sm text-ml-gray-400">
                    {tStudio("noManageDesc")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {manageBattles.map((battle) => (
                    <ManageBattleCard
                      key={battle.id}
                      battle={battle}
                      locale={locale}
                      tStudio={tStudio}
                      onUpdated={fetchStudioBattles}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Weekly Schedule */}
          {tab === "schedule" && (
            <div className="space-y-4">
              {/* Week navigation */}
              <div className="flex items-center justify-between bg-ml-dark-card rounded-xl border border-ml-dark-border p-3">
                <button
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="p-1.5 rounded-lg hover:bg-ml-dark-border transition-colors text-ml-gray-400 hover:text-ml-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <p className="text-sm font-medium text-ml-white">
                    {weekDays[0].toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                    {" — "}
                    {weekDays[6].toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  {weekOffset === 0 && (
                    <p className="text-[10px] text-ml-info font-medium">{tStudio("thisWeek")}</p>
                  )}
                </div>
                <button
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="p-1.5 rounded-lg hover:bg-ml-dark-border transition-colors text-ml-gray-400 hover:text-ml-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Days */}
              <div className="space-y-2">
                {weekDays.map((day, idx) => {
                  const dayBattles = weekBattles.filter((b) => {
                    const d = new Date(b.scheduledDate!);
                    return d.toDateString() === day.toDateString();
                  }).sort((a, b) =>
                    new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime()
                  );

                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "bg-ml-dark-card rounded-xl border p-3",
                        isToday ? "border-ml-red/40" : "border-ml-dark-border"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded",
                          isToday ? "bg-ml-red/20 text-ml-red" : "bg-ml-dark-border text-ml-gray-400"
                        )}>
                          {dayNames[idx]}
                        </span>
                        <span className="text-xs text-ml-gray-500">
                          {day.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                        </span>
                        {isToday && <span className="text-[10px] text-ml-red font-medium ml-auto">{tStudio("today")}</span>}
                      </div>

                      {dayBattles.length === 0 ? (
                        <p className="text-xs text-ml-gray-600 italic pl-1">—</p>
                      ) : (
                        <div className="space-y-2">
                          {dayBattles.map((battle) => (
                            <a
                              key={battle.id}
                              href={`/${locale}/duellolar/${battle.id}`}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-ml-dark-border/50 transition-colors"
                            >
                              <div className="text-center shrink-0 w-12">
                                <p className="text-sm font-bold text-ml-white">
                                  {new Date(battle.scheduledDate!).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                              <div className="h-8 w-px bg-ml-dark-border shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-ml-white truncate">
                                  {battle.challenger?.name} {battle.challenger?.surname} vs {battle.opponent?.name} {battle.opponent?.surname}
                                </p>
                                <div className="flex items-center gap-2">
                                  {battle.danceStyle && (
                                    <span className="text-[10px] text-ml-gray-400">{battle.danceStyle}</span>
                                  )}
                                  <span className={cn("text-[10px] font-medium", statusConfig[battle.status]?.color || "text-ml-gray-400")}>
                                    {statusConfig[battle.status]?.label}
                                  </span>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {weekBattles.length === 0 && (
                <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-6 text-center">
                  <CalendarDays className="w-6 h-6 text-ml-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-ml-gray-400">{tStudio("noSchedule")}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Manage Card with Inline Edit ───────────────────────────

function ManageBattleCard({ battle, locale, tStudio, onUpdated }: {
  battle: Battle;
  locale: string;
  tStudio: ReturnType<typeof useTranslations>;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Parse existing date into separate date and time fields
  const existingDate = battle.scheduledDate ? new Date(battle.scheduledDate) : null;
  const [date, setDate] = useState(
    existingDate ? existingDate.toISOString().slice(0, 10) : ""
  );
  const [time, setTime] = useState(
    existingDate
      ? existingDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", hour12: false })
      : ""
  );
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const scheduledDate = date && time ? new Date(`${date}T${time}`).toISOString() : undefined;
      const res = await fetch(`/api/battles/${battle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "studio-update",
          scheduledDate,
          studioNotes: notes || undefined,
          studioLocation: location || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Hata oluştu");
        return;
      }
      setSuccess(true);
      setEditing(false);
      onUpdated();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className={cn("flex items-center gap-1.5 text-xs font-medium", statusConfig[battle.status]?.color || "text-ml-gray-400")}>
          {statusConfig[battle.status]?.icon}
          {statusConfig[battle.status]?.label || battle.status}
        </div>
        <div className="flex items-center gap-2">
          {battle.scheduledDate && !editing && (
            <span className="text-xs text-ml-info">
              {new Date(battle.scheduledDate).toLocaleDateString("tr-TR", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
              })}
            </span>
          )}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg bg-ml-dark-border/50 hover:bg-ml-red/20 text-ml-gray-400 hover:text-ml-red transition-all"
              title={tStudio("edit")}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => { setEditing(false); setError(""); }}
              className="p-1.5 rounded-lg bg-ml-dark-border/50 hover:bg-ml-red/20 text-ml-gray-400 hover:text-ml-red transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Participants — clickable to detail */}
      <a href={`/${locale}/duellolar/${battle.id}`} className="block hover:opacity-80 transition-opacity">
        <BattleParticipants battle={battle} />
      </a>
      {battle.danceStyle && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-ml-gray-400">
          <Music className="w-3 h-3" />
          {battle.danceStyle}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mt-3 p-2 rounded-lg bg-ml-success/10 border border-ml-success/30 text-ml-success text-xs text-center font-medium">
          {tStudio("updateSuccess")}
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="mt-3 pt-3 border-t border-ml-dark-border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-ml-gray-500 mb-1">{tStudio("date")}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-ml-gray-500 mb-1">{tStudio("time")}</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-ml-gray-500 mb-1">{tStudio("location")}</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={tStudio("locationPlaceholder")}
              className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white placeholder:text-ml-gray-600 focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-ml-gray-500 mb-1">{tStudio("notes")}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tStudio("notesPlaceholder")}
              className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white placeholder:text-ml-gray-600 focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-ml-red text-center">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving || (!date && !time && !notes && !location)}
            className="w-full py-2.5 bg-ml-red hover:bg-ml-red-light text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {tStudio("saveUpdate")}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────

function BattleParticipants({ battle }: { battle: Battle }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-ml-red/20 flex items-center justify-center text-ml-red font-bold text-sm">
          {battle.challenger?.avatarUrl ? (
            <img src={battle.challenger.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            battle.challenger?.name?.[0] || "?"
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-ml-white">
            {battle.challenger?.name} {battle.challenger?.surname}
          </p>
          <p className="text-xs text-ml-gray-400">@{battle.challenger?.username}</p>
        </div>
      </div>

      <div className="px-3">
        <Swords className="w-5 h-5 text-ml-red" />
      </div>

      <div className="flex items-center gap-3 flex-1 justify-end text-right">
        <div>
          <p className="text-sm font-medium text-ml-white">
            {battle.opponent?.name} {battle.opponent?.surname}
          </p>
          <p className="text-xs text-ml-gray-400">@{battle.opponent?.username}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-ml-info/20 flex items-center justify-center text-ml-info font-bold text-sm">
          {battle.opponent?.avatarUrl ? (
            <img src={battle.opponent.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            battle.opponent?.name?.[0] || "?"
          )}
        </div>
      </div>
    </div>
  );
}

function BattleCard({ battle, locale }: { battle: Battle; locale: string }) {
  const st = statusConfig[battle.status] || statusConfig.pending;
  return (
    <a
      href={`/${locale}/duellolar/${battle.id}`}
      className="block bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 hover:border-ml-red/30 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn("flex items-center gap-1.5 text-xs font-medium", st.color)}>
          {st.icon}
          {st.label}
        </div>
        <span className="text-xs text-ml-gray-500">
          {new Date(battle.createdAt).toLocaleDateString("tr-TR")}
        </span>
      </div>

      <BattleParticipants battle={battle} />

      {battle.status === "completed" && (
        <div className="mt-3 pt-3 border-t border-ml-dark-border flex items-center justify-center gap-4 text-sm">
          <span className={cn(
            "font-bold",
            battle.winnerId === battle.challengerId ? "text-ml-success" : "text-ml-gray-400"
          )}>
            {battle.challengerScore}
          </span>
          <span className="text-ml-gray-500">—</span>
          <span className={cn(
            "font-bold",
            battle.winnerId === battle.opponentId ? "text-ml-success" : "text-ml-gray-400"
          )}>
            {battle.opponentScore}
          </span>
          {battle.ratingChange && (
            <span className="text-xs text-ml-gold ml-2">±{battle.ratingChange} ELO</span>
          )}
        </div>
      )}
    </a>
  );
}
