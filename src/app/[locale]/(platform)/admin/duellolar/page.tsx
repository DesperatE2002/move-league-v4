"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Swords,
  ArrowLeft,
  Loader2,
  Shield,
  UserCheck,
  Calendar,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Battle {
  id: string;
  challengerId: string;
  opponentId: string;
  challengerName: string;
  opponentName: string;
  status: string;
  judgeId: string | null;
  scheduledDate: string | null;
  createdAt: string;
}

interface JudgeUser {
  id: string;
  name: string;
  surname: string;
  username: string;
}

export default function AdminBattlesPage() {
  const t = useTranslations("admin");
  const tB = useTranslations("battles");
  const params = useParams();
  const { data: session } = useSession();
  const locale = params.locale as string;

  const [battles, setBattles] = useState<Battle[]>([]);
  const [judges, setJudges] = useState<JudgeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("studio_approved");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [scheduleModal, setScheduleModal] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [selectedJudge, setSelectedJudge] = useState("");

  useEffect(() => {
    fetchBattles();
    fetchJudges();
  }, [filter]);

  async function fetchBattles() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/battles?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setBattles(data.battles);
      }
    } catch {
      // fail
    } finally {
      setLoading(false);
    }
  }

  async function fetchJudges() {
    try {
      const res = await fetch("/api/admin/judges");
      if (res.ok) {
        const data = await res.json();
        setJudges(data.judges);
      }
    } catch {
      // fail
    }
  }

  async function handleAssignJudge(battleId: string, judgeId: string) {
    setActionLoading(battleId);
    try {
      const res = await fetch(`/api/battles/${battleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign-judge", judgeId }),
      });
      if (res.ok) fetchBattles();
    } catch {
      // fail
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSchedule(battleId: string) {
    if (!scheduleDate) return;
    setActionLoading(battleId);
    try {
      const res = await fetch(`/api/battles/${battleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          scheduledDate: scheduleDate,
          judgeId: selectedJudge || undefined,
        }),
      });
      if (res.ok) {
        setScheduleModal(null);
        setScheduleDate("");
        setSelectedJudge("");
        fetchBattles();
      }
    } catch {
      // fail
    } finally {
      setActionLoading(null);
    }
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 text-ml-gray-500 mx-auto mb-4" />
        <p className="text-ml-gray-400">{t("noAccess")}</p>
      </div>
    );
  }

  const filterTabs = ["studio_pending", "studio_approved", "accepted", "scheduled", "judge_assigned", "completed"];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <a href={`/${locale}/admin`} className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-card transition-all">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <h1 className="text-xl font-bold text-ml-white">{t("battleManagement")}</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              filter === f
                ? "bg-ml-red text-white"
                : "bg-ml-dark-card text-ml-gray-400 hover:text-ml-white"
            )}
          >
            {tB(`status_${f}`)}
          </button>
        ))}
      </div>

      {/* Battles */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : battles.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <Swords className="w-8 h-8 text-ml-gray-500 mx-auto mb-2" />
          <p className="text-sm text-ml-gray-400">{t("noBattlesInStatus")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {battles.map((battle) => (
            <div
              key={battle.id}
              className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-ml-red" />
                  <span className="text-sm font-semibold text-ml-white">
                    {battle.challengerName} vs {battle.opponentName}
                  </span>
                </div>
                <span className="text-xs text-ml-gray-500">
                  {new Date(battle.createdAt).toLocaleDateString("tr-TR")}
                </span>
              </div>

              {battle.scheduledDate && (
                <p className="text-xs text-ml-info flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(battle.scheduledDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}

              {/* Schedule Modal */}
              {scheduleModal === battle.id && (
                <div className="p-3 bg-ml-dark-hover rounded-lg space-y-3">
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-ml-dark border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white"
                  />
                  <select
                    value={selectedJudge}
                    onChange={(e) => setSelectedJudge(e.target.value)}
                    className="w-full bg-ml-dark border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white"
                  >
                    <option value="">{t("selectJudge")}</option>
                    {judges.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name} {j.surname} (@{j.username})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setScheduleModal(null)}
                      className="flex-1 py-2 text-xs bg-ml-dark-card text-ml-gray-300 rounded-lg"
                    >
                      {tB("cancelBattle")}
                    </button>
                    <button
                      onClick={() => handleSchedule(battle.id)}
                      disabled={!scheduleDate || actionLoading === battle.id}
                      className="flex-1 py-2 text-xs bg-ml-gold text-black font-semibold rounded-lg disabled:opacity-50"
                    >
                      {actionLoading === battle.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : t("schedule")}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {["accepted", "studio_approved"].includes(battle.status) && (
                  <button
                    onClick={() => setScheduleModal(scheduleModal === battle.id ? null : battle.id)}
                    className="flex-1 py-2 text-xs bg-ml-dark-hover text-ml-gray-300 rounded-lg flex items-center justify-center gap-1 hover:bg-ml-gold/10 hover:text-ml-gold transition-all"
                  >
                    <Calendar className="w-3 h-3" />
                    {t("schedule")}
                  </button>
                )}
                {["accepted", "studio_approved"].includes(battle.status) && !battle.judgeId && judges.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleAssignJudge(battle.id, e.target.value);
                    }}
                    disabled={actionLoading === battle.id}
                    className="flex-1 py-2 text-xs bg-ml-dark-hover text-ml-gray-300 rounded-lg px-2"
                  >
                    <option value="">{t("assignJudge")}</option>
                    {judges.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name} {j.surname}
                      </option>
                    ))}
                  </select>
                )}
                <a
                  href={`/${locale}/duellolar/${battle.id}`}
                  className="py-2 px-3 text-xs bg-ml-dark-hover text-ml-gray-300 rounded-lg flex items-center gap-1 hover:text-ml-white transition-all"
                >
                  {t("detail")}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
