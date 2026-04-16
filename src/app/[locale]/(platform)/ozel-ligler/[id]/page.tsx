"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Trophy, Loader2, Calendar, Users, Star, Gift, Swords,
  ArrowLeft, Crown, Medal, UserPlus, Play, CheckCircle,
  Search, X, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeagueDetail {
  id: string;
  name: string;
  description: string | null;
  danceStyle: string | null;
  maxMembers: number;
  startDate: string;
  endDate: string;
  status: string;
  firstPrize: string | null;
  secondPrize: string | null;
  thirdPrize: string | null;
  rules: string | null;
  ownerId: string;
  ownerName: string;
  ownerSurname: string;
  members: Member[];
  battles: Battle[];
}

interface Member {
  memberId: string;
  userId: string;
  name: string;
  surname: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  totalBattles: number;
  peakRating: number;
}

interface Battle {
  battleId: string;
  challengerName: string;
  challengerSurname: string;
  opponentName: string;
  opponentSurname: string;
  winnerId: string | null;
  status: string;
  challengerId: string;
  opponentId: string;
  ratingChange: number | null;
  createdAt: string;
}

interface SearchUser {
  id: string;
  name: string;
  surname: string;
  email: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-ml-warning/20 text-ml-warning",
  active: "bg-ml-success/20 text-ml-success",
  completed: "bg-ml-gray-400/20 text-ml-gray-400",
  cancelled: "bg-ml-error/20 text-ml-error",
};

export default function LeagueDetailPage() {
  const t = useTranslations("leagues");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const leagueId = params.id as string;
  const { data: session } = useSession();

  const [league, setLeague] = useState<LeagueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ranking" | "battles" | "info">("ranking");

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

  // Battle creation state
  const [showBattle, setShowBattle] = useState(false);
  const [battleChallenger, setBattleChallenger] = useState("");
  const [battleOpponent, setBattleOpponent] = useState("");
  const [creatingBattle, setCreatingBattle] = useState(false);

  // Score battle state
  const [scoringBattle, setScoringBattle] = useState<string | null>(null);
  const [scoreWinner, setScoreWinner] = useState<string>("");

  const isOwner = session?.user?.id === league?.ownerId;
  const isAdmin = session?.user?.role === "admin";
  const canManage = isOwner || isAdmin;

  const fetchLeague = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}`);
      if (res.ok) {
        const data = await res.json();
        setLeague(data.league);
      }
    } catch {} finally { setLoading(false); }
  }, [leagueId]);

  useEffect(() => { fetchLeague(); }, [fetchLeague]);

  // Search users for invite
  async function handleSearch() {
    if (searchQuery.length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?browse=true&q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        const memberIds = new Set(league?.members?.map((m) => m.userId) || []);
        setSearchResults((data.users || []).filter((u: SearchUser) => !memberIds.has(u.id)));
      }
    } catch {} finally { setSearching(false); }
  }

  async function handleInvite(userId: string) {
    setInviting(userId);
    try {
      await fetch(`/api/leagues/${leagueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite", userIds: [userId] }),
      });
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
    } catch {} finally { setInviting(null); }
  }

  async function handleActivate() {
    await fetch(`/api/leagues/${leagueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate" }),
    });
    fetchLeague();
  }

  async function handleComplete() {
    await fetch(`/api/leagues/${leagueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });
    fetchLeague();
  }

  async function handleCreateBattle() {
    if (!battleChallenger || !battleOpponent) return;
    setCreatingBattle(true);
    try {
      await fetch(`/api/leagues/${leagueId}/battles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengerId: battleChallenger, opponentId: battleOpponent }),
      });
      setShowBattle(false);
      setBattleChallenger("");
      setBattleOpponent("");
      fetchLeague();
    } catch {} finally { setCreatingBattle(false); }
  }

  async function handleScoreBattle(battleId: string) {
    if (!scoreWinner) return;
    setScoringBattle(battleId);
    try {
      await fetch(`/api/leagues/${leagueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battleId, winnerId: scoreWinner }),
      });
      setScoringBattle(null);
      setScoreWinner("");
      fetchLeague();
    } catch {} finally { setScoringBattle(null); }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-ml-gold animate-spin" />
      </div>
    );
  }

  if (!league) {
    return (
      <div className="text-center py-12 text-ml-gray-400">
        <p>{t("leagueNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.back()} className="p-2 hover:bg-ml-dark-hover rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5 text-ml-gray-400" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-ml-white truncate">{league.name}</h1>
          <p className="text-xs text-ml-gray-400">{league.ownerName} {league.ownerSurname}</p>
        </div>
        <span className={cn("px-2 py-1 rounded-lg text-[10px] font-medium", statusColors[league.status] || "")}>
          {league.status.toUpperCase()}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-3 text-center">
          <Users className="w-4 h-4 text-ml-gold mx-auto mb-1" />
          <p className="text-base font-bold text-ml-white">{league.members?.length || 0}</p>
          <p className="text-[10px] text-ml-gray-400">{t("members")}</p>
        </div>
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-3 text-center">
          <Swords className="w-4 h-4 text-ml-gold mx-auto mb-1" />
          <p className="text-base font-bold text-ml-white">{league.battles?.length || 0}</p>
          <p className="text-[10px] text-ml-gray-400">{t("battles")}</p>
        </div>
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-3 text-center">
          <Calendar className="w-4 h-4 text-ml-gold mx-auto mb-1" />
          <p className="text-[11px] font-bold text-ml-white">{new Date(league.endDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</p>
          <p className="text-[10px] text-ml-gray-400">{t("endDate")}</p>
        </div>
      </div>

      {/* Manager Actions */}
      {canManage && (
        <div className="flex gap-2 flex-wrap">
          {league.status === "draft" && (
            <button onClick={handleActivate} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ml-success/20 text-ml-success text-xs font-medium rounded-lg hover:bg-ml-success/30 transition-all">
              <Play className="w-3 h-3" /> {t("activate")}
            </button>
          )}
          {league.status === "active" && (
            <>
              <button onClick={handleComplete} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ml-gray-400/20 text-ml-gray-300 text-xs font-medium rounded-lg hover:bg-ml-gray-400/30 transition-all">
                <CheckCircle className="w-3 h-3" /> {t("complete")}
              </button>
              <button onClick={() => setShowBattle(!showBattle)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ml-gold/20 text-ml-gold text-xs font-medium rounded-lg hover:bg-ml-gold/30 transition-all">
                <Swords className="w-3 h-3" /> {t("createBattle")}
              </button>
            </>
          )}
          {(league.status === "draft" || league.status === "active") && (
            <button onClick={() => setShowInvite(!showInvite)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ml-primary/20 text-ml-primary text-xs font-medium rounded-lg hover:bg-ml-primary/30 transition-all">
              <UserPlus className="w-3 h-3" /> {t("inviteDancers")}
            </button>
          )}
        </div>
      )}

      {/* Invite Panel */}
      {showInvite && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-gold/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-ml-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="flex-1 bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white focus:outline-none focus:ring-2 focus:ring-ml-gold/40" placeholder={t("searchDancer")} />
            <button onClick={handleSearch} disabled={searching} className="px-3 py-2 bg-ml-gold text-black text-xs font-semibold rounded-lg">
              {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : t("search")}
            </button>
            <button onClick={() => { setShowInvite(false); setSearchResults([]); setSearchQuery(""); }} className="p-2 hover:bg-ml-dark-hover rounded-lg">
              <X className="w-4 h-4 text-ml-gray-400" />
            </button>
          </div>
          {searchResults.map((user) => (
            <div key={user.id} className="flex items-center justify-between bg-ml-dark-hover rounded-lg p-2">
              <span className="text-sm text-ml-white">{user.name} {user.surname}</span>
              <button onClick={() => handleInvite(user.id)} disabled={inviting === user.id} className="px-3 py-1 bg-ml-gold text-black text-xs font-semibold rounded-lg disabled:opacity-50">
                {inviting === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : t("invite")}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Battle Panel */}
      {showBattle && canManage && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-gold/30 p-4 space-y-3">
          <h4 className="text-sm font-bold text-ml-white">{t("createBattle")}</h4>
          <div className="grid grid-cols-2 gap-3">
            <select value={battleChallenger} onChange={(e) => setBattleChallenger(e.target.value)} className="bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white focus:outline-none">
              <option value="">{t("selectChallenger")}</option>
              {league.members?.map((m) => (
                <option key={m.userId} value={m.userId} disabled={m.userId === battleOpponent}>{m.name} {m.surname}</option>
              ))}
            </select>
            <select value={battleOpponent} onChange={(e) => setBattleOpponent(e.target.value)} className="bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white focus:outline-none">
              <option value="">{t("selectOpponent")}</option>
              {league.members?.map((m) => (
                <option key={m.userId} value={m.userId} disabled={m.userId === battleChallenger}>{m.name} {m.surname}</option>
              ))}
            </select>
          </div>
          <button onClick={handleCreateBattle} disabled={creatingBattle || !battleChallenger || !battleOpponent} className="w-full py-2 bg-ml-gold text-black text-sm font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {creatingBattle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
            {t("createBattle")}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-ml-dark-border pb-2">
        {(["ranking", "battles", "info"] as const).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", tab === tb ? "bg-ml-gold text-black" : "text-ml-gray-400 hover:text-ml-white")}>
            {t(tb)}
          </button>
        ))}
      </div>

      {/* Ranking Tab */}
      {tab === "ranking" && (
        <div className="space-y-2">
          {(!league.members || league.members.length === 0) ? (
            <p className="text-sm text-ml-gray-400 text-center py-8">{t("noMembers")}</p>
          ) : (
            league.members.map((member, idx) => (
              <div key={member.memberId} className={cn("flex items-center gap-3 bg-ml-dark-card rounded-xl border p-3", idx === 0 ? "border-ml-gold/40" : idx === 1 ? "border-gray-400/30" : idx === 2 ? "border-amber-700/30" : "border-ml-dark-border")}>
                <div className="w-7 text-center">
                  {idx === 0 ? <span className="text-lg">🥇</span> : idx === 1 ? <span className="text-lg">🥈</span> : idx === 2 ? <span className="text-lg">🥉</span> : <span className="text-sm font-bold text-ml-gray-400">{idx + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ml-white truncate">{member.name} {member.surname}</p>
                  <p className="text-[10px] text-ml-gray-400">{member.wins}W / {member.losses}L / {member.draws}D</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ml-gold">{member.rating}</p>
                  <p className="text-[10px] text-ml-gray-500">peak: {member.peakRating}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Battles Tab */}
      {tab === "battles" && (
        <div className="space-y-2">
          {(!league.battles || league.battles.length === 0) ? (
            <p className="text-sm text-ml-gray-400 text-center py-8">{t("noBattles")}</p>
          ) : (
            league.battles.map((battle) => (
              <div key={battle.battleId} className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 text-sm text-ml-white">
                    <span className={cn("font-semibold", battle.winnerId === battle.challengerId && "text-ml-success")}>{battle.challengerName}</span>
                    <span className="text-ml-gray-500 text-xs mx-1">vs</span>
                    <span className={cn("font-semibold", battle.winnerId === battle.opponentId && "text-ml-success")}>{battle.opponentName}</span>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", battle.status === "completed" ? "bg-ml-success/20 text-ml-success" : "bg-ml-warning/20 text-ml-warning")}>
                    {battle.status}
                  </span>
                </div>
                {battle.ratingChange && (
                  <p className="text-[10px] text-ml-gray-400">ELO: ±{battle.ratingChange}</p>
                )}
                {/* Score button for pending battles */}
                {canManage && battle.status === "pending" && (
                  <div className="mt-2 pt-2 border-t border-ml-dark-border">
                    {scoringBattle === battle.battleId ? (
                      <div className="flex items-center gap-2">
                        <select value={scoreWinner} onChange={(e) => setScoreWinner(e.target.value)} className="flex-1 bg-ml-dark-hover border border-ml-dark-border rounded-lg px-2 py-1 text-xs text-ml-white">
                          <option value="">{t("selectWinner")}</option>
                          <option value={battle.challengerId}>{battle.challengerName}</option>
                          <option value={battle.opponentId}>{battle.opponentName}</option>
                        </select>
                        <button onClick={() => handleScoreBattle(battle.battleId)} disabled={!scoreWinner} className="px-3 py-1 bg-ml-gold text-black text-xs font-semibold rounded-lg disabled:opacity-50">
                          {t("confirm")}
                        </button>
                        <button onClick={() => { setScoringBattle(null); setScoreWinner(""); }} className="px-2 py-1 text-xs text-ml-gray-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setScoringBattle(battle.battleId)} className="text-xs text-ml-gold hover:underline">
                        {t("scoreBattle")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Info Tab */}
      {tab === "info" && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-4">
          {league.description && (
            <div>
              <h4 className="text-xs text-ml-gray-400 mb-1">{t("description")}</h4>
              <p className="text-sm text-ml-white">{league.description}</p>
            </div>
          )}
          {league.danceStyle && (
            <div>
              <h4 className="text-xs text-ml-gray-400 mb-1">{t("danceStyle")}</h4>
              <p className="text-sm text-ml-white">{league.danceStyle}</p>
            </div>
          )}
          <div>
            <h4 className="text-xs text-ml-gray-400 mb-1">{t("dates")}</h4>
            <p className="text-sm text-ml-white">{new Date(league.startDate).toLocaleDateString("tr-TR")} - {new Date(league.endDate).toLocaleDateString("tr-TR")}</p>
          </div>
          {(league.firstPrize || league.secondPrize || league.thirdPrize) && (
            <div>
              <h4 className="text-xs text-ml-gray-400 mb-2">{t("prizes")}</h4>
              <div className="space-y-1">
                {league.firstPrize && <p className="text-sm text-ml-white">🥇 {league.firstPrize}</p>}
                {league.secondPrize && <p className="text-sm text-ml-white">🥈 {league.secondPrize}</p>}
                {league.thirdPrize && <p className="text-sm text-ml-white">🥉 {league.thirdPrize}</p>}
              </div>
            </div>
          )}
          {league.rules && (
            <div>
              <h4 className="text-xs text-ml-gray-400 mb-1">{t("rules")}</h4>
              <p className="text-sm text-ml-white whitespace-pre-wrap">{league.rules}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
