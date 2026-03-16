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
  ClipboardCheck,
  MapPin,
  Building2,
  CalendarDays,
  FileText,
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
  judgeId: string | null;
  studioId: string | null;
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
  studioPreferences: { userId: string; studioId: string; rank: number }[];
  studio: { id: string; name: string; city: string; address: string } | null;
  studioOwnerId: string | null;
}

interface StudioOption {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  isVerified: boolean;
}

const CATEGORIES = ["technique", "creativity", "musicality", "stagePresence"] as const;

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
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [scoreSubmitting, setScoreSubmitting] = useState(false);
  const [scoreSuccess, setScoreSuccess] = useState(false);
  const [scoreNotes, setScoreNotes] = useState("");
  const [allStudios, setAllStudios] = useState<StudioOption[]>([]);
  const [selectedStudios, setSelectedStudios] = useState<string[]>([]);
  const [studioSubmitting, setStudioSubmitting] = useState(false);
  const [studioSuccess, setStudioSuccess] = useState(false);
  const [approvalDate, setApprovalDate] = useState("");
  const [approvalTime, setApprovalTime] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approvalLocation, setApprovalLocation] = useState("");
  const [studioApproveLoading, setStudioApproveLoading] = useState(false);
  const [studioRejectLoading, setStudioRejectLoading] = useState(false);
  const [scores, setScores] = useState({
    challengerTechnique: 5,
    challengerCreativity: 5,
    challengerMusicality: 5,
    challengerStagePresence: 5,
    opponentTechnique: 5,
    opponentCreativity: 5,
    opponentMusicality: 5,
    opponentStagePresence: 5,
  });

  useEffect(() => {
    fetchBattle();
  }, [id]);

  useEffect(() => {
    if (battle?.status === "studio_pending") {
      fetchStudios();
    }
  }, [battle?.status]);

  async function fetchStudios() {
    try {
      const res = await fetch("/api/studios");
      if (res.ok) {
        const data = await res.json();
        setAllStudios(data.studios);
      }
    } catch {
      // fail
    }
  }

  async function handleSubmitStudios() {
    if (selectedStudios.length === 0) return;
    setStudioSubmitting(true);
    try {
      const res = await fetch(`/api/battles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select-studios", studioIds: selectedStudios }),
      });
      if (res.ok) {
        setStudioSuccess(true);
        fetchBattle();
      }
    } catch {
      // fail
    } finally {
      setStudioSubmitting(false);
    }
  }

  function toggleStudio(studioId: string) {
    setSelectedStudios((prev) => {
      if (prev.includes(studioId)) return prev.filter((s) => s !== studioId);
      if (prev.length >= 4) return prev;
      return [...prev, studioId];
    });
  }

  async function handleStudioApprove() {
    setStudioApproveLoading(true);
    try {
      const scheduledDate = approvalDate && approvalTime
        ? new Date(`${approvalDate}T${approvalTime}`).toISOString()
        : approvalDate
          ? new Date(approvalDate).toISOString()
          : undefined;
      const res = await fetch(`/api/battles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "studio-approve",
          scheduledDate,
          studioLocation: approvalLocation || undefined,
          studioNotes: approvalNotes || undefined,
        }),
      });
      if (res.ok) fetchBattle();
    } catch {
      // fail
    } finally {
      setStudioApproveLoading(false);
    }
  }

  async function handleStudioReject() {
    setStudioRejectLoading(true);
    try {
      const res = await fetch(`/api/battles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "studio-reject",
          studioNotes: approvalNotes || undefined,
        }),
      });
      if (res.ok) fetchBattle();
    } catch {
      // fail
    } finally {
      setStudioRejectLoading(false);
    }
  }

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

  async function handleSubmitScore() {
    setScoreSubmitting(true);
    try {
      const res = await fetch(`/api/battles/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...scores, notes: scoreNotes || undefined }),
      });
      if (res.ok) {
        setScoreSuccess(true);
        setShowScoreForm(false);
        fetchBattle();
      }
    } catch {
      // fail
    } finally {
      setScoreSubmitting(false);
    }
  }

  function updateScore(key: keyof typeof scores, value: number) {
    setScores((prev) => ({ ...prev, [key]: Math.min(10, Math.max(1, value)) }));
  }

  const challengerTotal = scores.challengerTechnique + scores.challengerCreativity + scores.challengerMusicality + scores.challengerStagePresence;
  const opponentTotal = scores.opponentTechnique + scores.opponentCreativity + scores.opponentMusicality + scores.opponentStagePresence;

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

      {/* Studio Info (when studio is matched) */}
      {battle.studio && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-success/30 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-ml-success/10">
              <Building2 className="w-5 h-5 text-ml-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ml-white">{battle.studio.name}</p>
              <p className="text-xs text-ml-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {battle.studio.city} — {battle.studio.address}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Studio Selection Form — only when no studio matched yet */}
      {battle.status === "studio_pending" && !battle.studioId && (isChallenger || isOpponent) && (() => {
        const myPrefs = battle.studioPreferences?.filter((p) => p.userId === userId) ?? [];
        const hasSubmitted = myPrefs.length > 0 || studioSuccess;
        const otherPrefs = battle.studioPreferences?.filter((p) => p.userId !== userId) ?? [];
        const otherHasSubmitted = otherPrefs.length > 0;

        if (hasSubmitted) {
          return (
            <div className="bg-ml-dark-card rounded-xl border border-ml-info/30 p-4 text-center">
              <CheckCircle className="w-8 h-8 text-ml-info mx-auto mb-2" />
              <p className="text-sm font-semibold text-ml-white">{t("studioPrefsSubmitted")}</p>
              <p className="text-xs text-ml-gray-400 mt-1">
                {otherHasSubmitted ? t("studioMatching") : t("studioWaitingOther")}
              </p>
            </div>
          );
        }

        return (
          <div className="bg-ml-dark-card rounded-2xl border border-ml-info/30 p-5 space-y-4">
            <h3 className="text-base font-bold text-ml-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-ml-info" />
              {t("selectStudios")}
            </h3>
            <p className="text-xs text-ml-gray-400">{t("selectStudiosDesc")}</p>

            {allStudios.length === 0 ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-ml-info animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {allStudios.map((studio) => {
                  const isSelected = selectedStudios.includes(studio.id);
                  const rank = selectedStudios.indexOf(studio.id) + 1;
                  return (
                    <button
                      key={studio.id}
                      onClick={() => toggleStudio(studio.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                        isSelected
                          ? "bg-ml-info/10 border-ml-info/40"
                          : "bg-ml-dark-hover border-ml-dark-border hover:border-ml-info/30"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                        isSelected ? "bg-ml-info text-white" : "bg-ml-dark-card text-ml-gray-500"
                      )}>
                        {isSelected ? rank : "-"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium truncate", isSelected ? "text-ml-white" : "text-ml-gray-300")}>
                          {studio.name}
                          {studio.isVerified && <span className="ml-1 text-ml-info">✓</span>}
                        </p>
                        <p className="text-xs text-ml-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {studio.city} — {studio.address}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedStudios.length > 0 && (
              <button
                onClick={handleSubmitStudios}
                disabled={studioSubmitting}
                className="w-full py-3 bg-ml-info hover:bg-ml-info/80 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {studioSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {t("submitStudios")} ({selectedStudios.length}/4)
              </button>
            )}
          </div>
        );
      })()}

      {/* Studio Owner Approval Form — when studio is matched and user owns the studio */}
      {battle.status === "studio_pending" && battle.studioId && battle.studioOwnerId === userId && (
        <div className="bg-ml-dark-card rounded-2xl border border-ml-gold/30 p-5 space-y-4">
          <h3 className="text-base font-bold text-ml-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-ml-gold" />
            {t("studioApprovalTitle")}
          </h3>
          <p className="text-xs text-ml-gray-400">{t("studioApprovalDesc")}</p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-ml-gray-400 mb-1 block flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {t("studioDate")}
              </label>
              <input
                type="date"
                value={approvalDate}
                onChange={(e) => setApprovalDate(e.target.value)}
                className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-xl px-4 py-3 text-sm text-ml-white focus:outline-none focus:ring-2 focus:ring-ml-gold/40"
              />
            </div>
            <div>
              <label className="text-xs text-ml-gray-400 mb-1 block flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t("studioTime")}
              </label>
              <input
                type="time"
                value={approvalTime}
                onChange={(e) => setApprovalTime(e.target.value)}
                className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-xl px-4 py-3 text-sm text-ml-white focus:outline-none focus:ring-2 focus:ring-ml-gold/40"
              />
            </div>
            <div>
              <label className="text-xs text-ml-gray-400 mb-1 block flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {t("studioLocation")}
              </label>
              <input
                type="text"
                value={approvalLocation}
                onChange={(e) => setApprovalLocation(e.target.value)}
                placeholder={t("studioLocationPlaceholder")}
                className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-xl px-4 py-3 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-gold/40"
              />
            </div>
            <div>
              <label className="text-xs text-ml-gray-400 mb-1 block flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {t("studioNotes")}
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder={t("studioNotesPlaceholder")}
                className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-xl px-4 py-3 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-gold/40 resize-none"
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStudioReject}
              disabled={studioRejectLoading}
              className="flex-1 py-3 bg-ml-dark-hover border border-ml-dark-border hover:border-ml-red/40 text-ml-gray-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {studioRejectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              {t("rejectStudio")}
            </button>
            <button
              onClick={handleStudioApprove}
              disabled={studioApproveLoading}
              className="flex-1 py-3 bg-ml-success hover:bg-ml-success/80 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {studioApproveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {t("approveStudio")}
            </button>
          </div>
        </div>
      )}

      {/* Dancer waiting for studio approval */}
      {battle.status === "studio_pending" && battle.studioId && (isChallenger || isOpponent) && battle.studioOwnerId !== userId && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-warning/30 p-4 text-center">
          <Clock className="w-8 h-8 text-ml-warning mx-auto mb-2 animate-pulse" />
          <p className="text-sm font-semibold text-ml-white">{t("studioWaitingApproval")}</p>
          <p className="text-xs text-ml-gray-400 mt-1">{t("studioWaitingApprovalDesc")}</p>
        </div>
      )}

      {/* Studio Approved Info */}
      {battle.status === "studio_approved" && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-success/30 p-4 text-center">
          <CheckCircle className="w-8 h-8 text-ml-success mx-auto mb-2" />
          <p className="text-sm font-semibold text-ml-success">{t("studioApprovedMsg")}</p>
        </div>
      )}

      {/* Judge Scoring Form */}
      {["accepted", "scheduled", "judge_assigned", "studio_approved"].includes(battle.status) &&
        (session?.user?.role === "admin" || battle.judgeId === userId) &&
        !scoreSuccess && (
        <div className="space-y-4">
          {!showScoreForm ? (
            <button
              onClick={() => setShowScoreForm(true)}
              className="w-full py-3 bg-ml-gold hover:bg-ml-gold/80 text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="w-5 h-5" />
              {t("startScoring")}
            </button>
          ) : (
            <div className="bg-ml-dark-card rounded-2xl border border-ml-gold/30 p-5 space-y-5">
              <h3 className="text-base font-bold text-ml-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-ml-gold" />
                {t("scoringForm")}
              </h3>

              {/* Challenger Scores */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-ml-red">
                  {battle.challenger?.name} {battle.challenger?.surname}
                </p>
                {CATEGORIES.map((cat) => {
                  const key = `challenger${cat[0].toUpperCase()}${cat.slice(1)}` as keyof typeof scores;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-ml-gray-400 w-28">{t(cat)}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateScore(key, scores[key] - 1)} className="w-7 h-7 rounded-lg bg-ml-dark-hover text-ml-gray-300 flex items-center justify-center text-sm font-bold hover:bg-ml-red/20">−</button>
                        <span className="w-8 text-center text-sm font-bold text-ml-white">{scores[key]}</span>
                        <button onClick={() => updateScore(key, scores[key] + 1)} className="w-7 h-7 rounded-lg bg-ml-dark-hover text-ml-gray-300 flex items-center justify-center text-sm font-bold hover:bg-ml-success/20">+</button>
                      </div>
                    </div>
                  );
                })}
                <div className="text-right text-sm font-bold text-ml-red">
                  {t("total")}: {challengerTotal}/40
                </div>
              </div>

              <div className="border-t border-ml-dark-border" />

              {/* Opponent Scores */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-ml-info">
                  {battle.opponent?.name} {battle.opponent?.surname}
                </p>
                {CATEGORIES.map((cat) => {
                  const key = `opponent${cat[0].toUpperCase()}${cat.slice(1)}` as keyof typeof scores;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-ml-gray-400 w-28">{t(cat)}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateScore(key, scores[key] - 1)} className="w-7 h-7 rounded-lg bg-ml-dark-hover text-ml-gray-300 flex items-center justify-center text-sm font-bold hover:bg-ml-red/20">−</button>
                        <span className="w-8 text-center text-sm font-bold text-ml-white">{scores[key]}</span>
                        <button onClick={() => updateScore(key, scores[key] + 1)} className="w-7 h-7 rounded-lg bg-ml-dark-hover text-ml-gray-300 flex items-center justify-center text-sm font-bold hover:bg-ml-success/20">+</button>
                      </div>
                    </div>
                  );
                })}
                <div className="text-right text-sm font-bold text-ml-info">
                  {t("total")}: {opponentTotal}/40
                </div>
              </div>

              <div className="border-t border-ml-dark-border" />

              {/* Notes */}
              <textarea
                value={scoreNotes}
                onChange={(e) => setScoreNotes(e.target.value)}
                placeholder={t("judgeNotes")}
                className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-xl px-4 py-3 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-gold/40 resize-none"
                rows={2}
              />

              {/* Preview */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-ml-dark-hover">
                <span className="text-xs text-ml-gray-400">{t("predictedWinner")}:</span>
                <span className="text-sm font-bold text-ml-white">
                  {challengerTotal > opponentTotal
                    ? `${battle.challenger?.name} (${challengerTotal}-${opponentTotal})`
                    : challengerTotal < opponentTotal
                      ? `${battle.opponent?.name} (${opponentTotal}-${challengerTotal})`
                      : t("draw")}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowScoreForm(false)}
                  className="flex-1 py-3 bg-ml-dark-hover text-ml-gray-300 font-semibold rounded-xl"
                >
                  {t("cancelScoring")}
                </button>
                <button
                  onClick={handleSubmitScore}
                  disabled={scoreSubmitting}
                  className="flex-1 py-3 bg-ml-gold hover:bg-ml-gold/80 text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {scoreSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {t("submitScore")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {scoreSuccess && (
        <div className="bg-ml-success/10 border border-ml-success/30 rounded-xl p-4 text-center">
          <CheckCircle className="w-8 h-8 text-ml-success mx-auto mb-2" />
          <p className="text-sm font-semibold text-ml-success">{t("scoreSubmitted")}</p>
        </div>
      )}

      <p className="text-xs text-ml-gray-500 text-center">
        {t("created")}: {new Date(battle.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}
