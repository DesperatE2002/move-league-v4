"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  Swords,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trophy,
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
  const params = useParams();
  const locale = params.locale as string;

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

  async function handleAction(battleId: string, action: string) {
    try {
      const res = await fetch(`/api/battles/${battleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchBattles();
      }
    } catch {
      // silently fail
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
        <a
          href={`/${locale}/duellolar/yeni`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-ml-red hover:bg-ml-red-light text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-ml-red/20 active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          {tBattle("newBattle")}
        </a>
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
          <a
            href={`/${locale}/duellolar/yeni`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-ml-red hover:bg-ml-red-light text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            {tBattle("newBattle")}
          </a>
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {filteredBattles.map((battle) => {
            const st = statusConfig[battle.status] || statusConfig.pending;
            return (
              <a
                key={battle.id}
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-ml-red/20 flex items-center justify-center text-ml-red font-bold text-sm">
                      {battle.challenger?.name?.[0] || "?"}
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
                      {battle.opponent?.name?.[0] || "?"}
                    </div>
                  </div>
                </div>

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
          })}
        </div>
      )}
    </div>
  );
}
