"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Swords,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BattleUser {
  id: string;
  name: string;
  surname: string;
  username: string;
  avatarUrl: string | null;
}

interface Score {
  dancerId: string;
  technique: number;
  creativity: number;
  musicality: number;
  stagePresence: number;
  totalScore: number;
}

interface BattleDetail {
  id: string;
  challengerId: string;
  opponentId: string;
  status: string;
  scheduledDate: string | null;
  challengerScore: number | null;
  opponentScore: number | null;
  winnerId: string | null;
  ratingChange: number | null;
  createdAt: string;
  challenger: BattleUser | null;
  opponent: BattleUser | null;
  scores: Score[];
}

export default function BattleDetailPage() {
  const t = useTranslations("battles");
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const locale = params.locale as string;
  const id = params.id as string;

  const [battle, setBattle] = useState<BattleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBattle();
  }, [id]);

  async function fetchBattle() {
    try {
      const res = await fetch(`/api/battles/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBattle(data);
      }
    } catch {
      // fail
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/battles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchBattle();
      }
    } catch {
      // fail
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-ml-red animate-spin" />
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="text-center py-20">
        <p className="text-ml-gray-400">{t("notFound")}</p>
      </div>
    );
  }

  const userId = session?.user?.id;
  const isChallenger = userId === battle.challengerId;
  const isOpponent = userId === battle.opponentId;
  const challengerScore = battle.scores.find((s) => s.dancerId === battle.challengerId);
  const opponentScore = battle.scores.find((s) => s.dancerId === battle.opponentId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <a
          href={`/${locale}/duellolar`}
          className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-card transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </a>
        <h1 className="text-xl font-bold text-ml-white">{t("battleDetail")}</h1>
      </div>

      {/* Status Banner */}
      <div className={cn(
        "rounded-xl p-4 text-center border",
        battle.status === "completed" ? "bg-ml-success/10 border-ml-success/30" :
        battle.status === "pending" ? "bg-ml-warning/10 border-ml-warning/30" :
        battle.status === "declined" || battle.status === "cancelled" ? "bg-ml-gray-500/10 border-ml-gray-500/30" :
        "bg-ml-info/10 border-ml-info/30"
      )}>
        <p className={cn(
          "text-sm font-semibold",
          battle.status === "completed" ? "text-ml-success" :
          battle.status === "pending" ? "text-ml-warning" :
          battle.status === "declined" || battle.status === "cancelled" ? "text-ml-gray-400" :
          "text-ml-info"
        )}>
          {t(`status_${battle.status}`)}
        </p>
        {battle.scheduledDate && (
          <p className="text-xs text-ml-gray-400 mt-1">
            {new Date(battle.scheduledDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {/* VS Card */}
      <div className="bg-ml-dark-card rounded-2xl border border-ml-dark-border p-6">
        <div className="flex items-center justify-between">
          {/* Challenger */}
          <div className="text-center flex-1">
            <div className="w-16 h-16 rounded-full bg-ml-red/20 flex items-center justify-center text-ml-red font-bold text-xl mx-auto mb-2">
              {battle.challenger?.name?.[0] || "?"}
            </div>
            <p className="text-sm font-semibold text-ml-white">
              {battle.challenger?.name}
            </p>
            <p className="text-xs text-ml-gray-400">
              @{battle.challenger?.username}
            </p>
            {battle.status === "completed" && (
              <div className="mt-2">
                <p className={cn(
                  "text-2xl font-bold",
                  battle.winnerId === battle.challengerId ? "text-ml-success" : "text-ml-gray-400"
                )}>
                  {battle.challengerScore}
                </p>
                {battle.winnerId === battle.challengerId && (
                  <div className="inline-flex items-center gap-1 text-xs text-ml-gold mt-1">
                    <Trophy className="w-3 h-3" />
                    {t("winner")}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* VS */}
          <div className="px-4">
            <div className="w-14 h-14 rounded-full bg-ml-red/10 flex items-center justify-center">
              <Swords className="w-7 h-7 text-ml-red" />
            </div>
          </div>

          {/* Opponent */}
          <div className="text-center flex-1">
            <div className="w-16 h-16 rounded-full bg-ml-info/20 flex items-center justify-center text-ml-info font-bold text-xl mx-auto mb-2">
              {battle.opponent?.name?.[0] || "?"}
            </div>
            <p className="text-sm font-semibold text-ml-white">
              {battle.opponent?.name}
            </p>
            <p className="text-xs text-ml-gray-400">
              @{battle.opponent?.username}
            </p>
            {battle.status === "completed" && (
              <div className="mt-2">
                <p className={cn(
                  "text-2xl font-bold",
                  battle.winnerId === battle.opponentId ? "text-ml-success" : "text-ml-gray-400"
                )}>
                  {battle.opponentScore}
                </p>
                {battle.winnerId === battle.opponentId && (
                  <div className="inline-flex items-center gap-1 text-xs text-ml-gold mt-1">
                    <Trophy className="w-3 h-3" />
                    {t("winner")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {battle.ratingChange && battle.status === "completed" && (
          <div className="mt-4 pt-4 border-t border-ml-dark-border text-center">
            <p className="text-xs text-ml-gray-400">{t("ratingChange")}</p>
            <p className="text-lg font-bold text-ml-gold">±{battle.ratingChange} ELO</p>
          </div>
        )}
      </div>

      {/* Score Breakdown */}
      {battle.status === "completed" && (challengerScore || opponentScore) && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4">
          <h3 className="text-sm font-semibold text-ml-white mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-ml-gold" />
            {t("scoreBreakdown")}
          </h3>
          <div className="space-y-2">
            {["technique", "creativity", "musicality", "stagePresence"].map((cat) => (
              <div key={cat} className="flex items-center justify-between text-xs">
                <span className="text-ml-gray-400 w-24">{t(cat)}</span>
                <div className="flex-1 flex items-center gap-2 justify-end">
                  <span className={cn(
                    "font-bold w-6 text-right",
                    (challengerScore?.[cat as keyof Score] ?? 0) >= (opponentScore?.[cat as keyof Score] ?? 0)
                      ? "text-ml-success"
                      : "text-ml-gray-400"
                  )}>
                    {challengerScore?.[cat as keyof Score] ?? "-"}
                  </span>
                  <span className="text-ml-gray-500">—</span>
                  <span className={cn(
                    "font-bold w-6",
                    (opponentScore?.[cat as keyof Score] ?? 0) >= (challengerScore?.[cat as keyof Score] ?? 0)
                      ? "text-ml-success"
                      : "text-ml-gray-400"
                  )}>
                    {opponentScore?.[cat as keyof Score] ?? "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {battle.status === "pending" && isOpponent && (
        <div className="flex gap-3">
          <button
            onClick={() => handleAction("accept")}
            disabled={actionLoading}
            className="flex-1 py-3 bg-ml-success hover:bg-ml-success/80 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {t("accept")}
          </button>
          <button
            onClick={() => handleAction("decline")}
            disabled={actionLoading}
            className="flex-1 py-3 bg-ml-dark-card border border-ml-dark-border hover:border-ml-red/40 text-ml-gray-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            {t("decline")}
          </button>
        </div>
      )}

      {battle.status === "pending" && isChallenger && (
        <button
          onClick={() => handleAction("cancel")}
          disabled={actionLoading}
          className="w-full py-3 bg-ml-dark-card border border-ml-dark-border hover:border-ml-red/40 text-ml-gray-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          {t("cancelBattle")}
        </button>
      )}

      <p className="text-xs text-ml-gray-500 text-center">
        {t("created")}: {new Date(battle.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}
