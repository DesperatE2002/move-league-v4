"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Trophy,
  Plus,
  Loader2,
  Calendar,
  Users,
  Star,
  Gift,
  Swords,
  ChevronRight,
  Crown,
  Medal,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface League {
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
  memberCount: number;
  myRating?: number;
  myWins?: number;
  myLosses?: number;
}

interface Invite {
  inviteId: string;
  leagueId: string;
  leagueName: string;
  description: string | null;
  danceStyle: string | null;
  startDate: string;
  endDate: string;
  firstPrize: string | null;
  ownerName: string;
  ownerSurname: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: "text-ml-warning",
  active: "text-ml-success",
  completed: "text-ml-gray-400",
  cancelled: "text-ml-error",
};

const statusLabels: Record<string, Record<string, string>> = {
  draft: { tr: "Taslak", en: "Draft" },
  active: { tr: "Aktif", en: "Active" },
  completed: { tr: "Tamamlandı", en: "Completed" },
  cancelled: { tr: "İptal", en: "Cancelled" },
};

export default function PrivateLeaguesPage() {
  const t = useTranslations("leagues");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { data: session } = useSession();

  const isStudio = session?.user?.role === "studio";
  const isAdmin = session?.user?.role === "admin";

  if (isStudio || isAdmin) {
    return <StudioLeagueView locale={locale} t={t} />;
  }

  return <DancerLeagueView locale={locale} t={t} />;
}

// ─── Studio / Admin View ─────────────────────────────────────
function StudioLeagueView({ locale, t }: { locale: string; t: ReturnType<typeof useTranslations> }) {
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", danceStyle: "", maxMembers: 20,
    startDate: "", endDate: "", firstPrize: "", secondPrize: "", thirdPrize: "", rules: "",
  });

  useEffect(() => { fetchLeagues(); }, []);

  async function fetchLeagues() {
    try {
      const res = await fetch("/api/leagues?mode=my");
      if (res.ok) {
        const data = await res.json();
        setLeagues(data.leagues || []);
      }
    } catch {} finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.name || !form.startDate || !form.endDate) return;
    setCreating(true);
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, maxMembers: Number(form.maxMembers) }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreate(false);
        setForm({ name: "", description: "", danceStyle: "", maxMembers: 20, startDate: "", endDate: "", firstPrize: "", secondPrize: "", thirdPrize: "", rules: "" });
        fetchLeagues();
      }
    } catch {} finally { setCreating(false); }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ml-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-ml-gold" />
          {t("title")}
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-ml-gold hover:bg-ml-gold/80 text-black text-sm font-semibold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          {t("createLeague")}
        </button>
      </div>

      {/* Create League Form */}
      {showCreate && (
        <div className="bg-ml-dark-card rounded-2xl border border-ml-gold/30 p-5 space-y-4">
          <h3 className="text-base font-bold text-ml-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-ml-gold" />
            {t("newLeague")}
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-ml-gray-400 mb-1 block">{t("leagueName")}</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-xl px-4 py-3 text-sm text-ml-white focus:outline-none focus:ring-2 focus:ring-ml-gold/40" placeholder={t("leagueNamePlaceholder")} />
            </div>

            <div>
              <label className="text-xs text-ml-gray-400 mb-1 block">{t("description")}</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-xl px-4 py-3 text-sm text-ml-white focus:outline-none focus:ring-2 focus:ring-ml-gold/40 resize-none" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ml-gray-400 mb-1 block">{t("startDate")}</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-xl px-4 py-3 text-sm text-ml-white focus:outline-none focus:ring-2 focus:ring-ml-gold/40" />
              </div>
              <div>
                <label className="text-xs text-ml-gray-400 mb-1 block">{t("endDate")}</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-xl px-4 py-3 text-sm text-ml-white focus:outline-none focus:ring-2 focus:ring-ml-gold/40" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ml-gray-400 mb-1 block">{t("danceStyle")}</label>
                <input type="text" value={form.danceStyle} onChange={(e) => setForm({ ...form, danceStyle: e.target.value })} className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-xl px-4 py-3 text-sm text-ml-white focus:outline-none focus:ring-2 focus:ring-ml-gold/40" placeholder="Bachata, Salsa..." />
              </div>
              <div>
                <label className="text-xs text-ml-gray-400 mb-1 block">{t("maxMembers")}</label>
                <input type="number" value={form.maxMembers} onChange={(e) => setForm({ ...form, maxMembers: Number(e.target.value) })} className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-xl px-4 py-3 text-sm text-ml-white focus:outline-none focus:ring-2 focus:ring-ml-gold/40" min={2} max={100} />
              </div>
            </div>

            <div>
              <label className="text-xs text-ml-gray-400 mb-1 block">{t("prizes")}</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-ml-gold text-xs font-bold w-4">🥇</span>
                  <input type="text" value={form.firstPrize} onChange={(e) => setForm({ ...form, firstPrize: e.target.value })} className="flex-1 bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white focus:outline-none focus:ring-2 focus:ring-ml-gold/40" placeholder={t("firstPrize")} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ml-gray-400 text-xs font-bold w-4">🥈</span>
                  <input type="text" value={form.secondPrize} onChange={(e) => setForm({ ...form, secondPrize: e.target.value })} className="flex-1 bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white focus:outline-none focus:ring-2 focus:ring-ml-gold/40" placeholder={t("secondPrize")} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ml-gray-400 text-xs font-bold w-4">🥉</span>
                  <input type="text" value={form.thirdPrize} onChange={(e) => setForm({ ...form, thirdPrize: e.target.value })} className="flex-1 bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white focus:outline-none focus:ring-2 focus:ring-ml-gold/40" placeholder={t("thirdPrize")} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-ml-gray-400 mb-1 block">{t("rules")}</label>
              <textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-xl px-4 py-3 text-sm text-ml-white focus:outline-none focus:ring-2 focus:ring-ml-gold/40 resize-none" rows={3} placeholder={t("rulesPlaceholder")} />
            </div>

            <button onClick={handleCreate} disabled={creating || !form.name || !form.startDate || !form.endDate} className="w-full py-3 bg-ml-gold hover:bg-ml-gold/80 text-black font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
              {t("create")}
            </button>
          </div>
        </div>
      )}

      {/* League List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-gold animate-spin" />
        </div>
      ) : leagues.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <div className="inline-flex p-4 rounded-full bg-ml-gold/10 mb-4">
            <Trophy className="w-8 h-8 text-ml-gold" />
          </div>
          <h2 className="text-lg font-semibold text-ml-white mb-2">{t("noLeagues")}</h2>
          <p className="text-sm text-ml-gray-400">{t("noLeaguesDesc")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leagues.map((league) => (
            <a key={league.id} href={`/${locale}/ozel-ligler/${league.id}`} className="block bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 hover:border-ml-gold/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-ml-white">{league.name}</h3>
                <span className={cn("text-xs font-medium", statusColors[league.status] || "text-ml-gray-400")}>
                  {statusLabels[league.status]?.[locale] || league.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-ml-gray-400">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{league.memberCount}/{league.maxMembers}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(league.startDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} - {new Date(league.endDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
                {league.danceStyle && <span className="flex items-center gap-1"><Star className="w-3 h-3" />{league.danceStyle}</span>}
              </div>
              {league.firstPrize && (
                <div className="mt-2 flex items-center gap-1 text-xs text-ml-gold">
                  <Gift className="w-3 h-3" /> {league.firstPrize}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dancer View ─────────────────────────────────────
function DancerLeagueView({ locale, t }: { locale: string; t: ReturnType<typeof useTranslations> }) {
  const [tab, setTab] = useState<"joined" | "invites">("joined");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, [tab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (tab === "joined") {
        const res = await fetch("/api/leagues?mode=joined");
        if (res.ok) {
          const data = await res.json();
          setLeagues(data.leagues || []);
        }
      } else {
        const res = await fetch("/api/leagues?mode=invites");
        if (res.ok) {
          const data = await res.json();
          setInvites(data.invites || []);
        }
      }
    } catch {} finally { setLoading(false); }
  }

  async function handleInviteResponse(inviteId: string, leagueId: string, response: "accepted" | "declined") {
    setRespondingId(inviteId);
    try {
      await fetch(`/api/leagues/${leagueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond-invite", inviteId, response }),
      });
      fetchData();
    } catch {} finally { setRespondingId(null); }
  }

  const tabs = [
    { key: "joined" as const, label: t("myLeagues") },
    { key: "invites" as const, label: t("invites") },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold text-ml-white flex items-center gap-2">
        <Crown className="w-5 h-5 text-ml-gold" />
        {t("title")}
      </h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", tab === tb.key ? "bg-ml-gold text-black" : "bg-ml-dark-card text-ml-gray-400 border border-ml-dark-border hover:border-ml-gold/40")}>
            {tb.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-gold animate-spin" />
        </div>
      ) : tab === "joined" ? (
        leagues.length === 0 ? (
          <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
            <div className="inline-flex p-4 rounded-full bg-ml-gold/10 mb-4">
              <Trophy className="w-8 h-8 text-ml-gold" />
            </div>
            <h2 className="text-lg font-semibold text-ml-white mb-2">{t("noJoinedLeagues")}</h2>
            <p className="text-sm text-ml-gray-400">{t("noJoinedLeaguesDesc")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leagues.map((league) => (
              <a key={league.id} href={`/${locale}/ozel-ligler/${league.id}`} className="block bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 hover:border-ml-gold/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-ml-white">{league.name}</h3>
                  <span className="text-xs font-bold text-ml-gold">{league.myRating ?? 1000} ELO</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-ml-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(league.startDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} - {new Date(league.endDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
                  {league.danceStyle && <span className="flex items-center gap-1"><Star className="w-3 h-3" />{league.danceStyle}</span>}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="text-ml-success">W: {league.myWins ?? 0}</span>
                  <span className="text-ml-error">L: {league.myLosses ?? 0}</span>
                </div>
              </a>
            ))}
          </div>
        )
      ) : (
        invites.length === 0 ? (
          <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
            <p className="text-sm text-ml-gray-400">{t("noInvites")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((inv) => (
              <div key={inv.inviteId} className="bg-ml-dark-card rounded-xl border border-ml-gold/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-ml-white">{inv.leagueName}</h3>
                  <span className="text-[10px] text-ml-gray-500">{new Date(inv.createdAt).toLocaleDateString("tr-TR")}</span>
                </div>
                <p className="text-xs text-ml-gray-400 mb-1">{t("invitedBy")}: {inv.ownerName} {inv.ownerSurname}</p>
                {inv.firstPrize && <p className="text-xs text-ml-gold mb-2">🥇 {inv.firstPrize}</p>}
                <div className="flex gap-2">
                  <button onClick={() => handleInviteResponse(inv.inviteId, inv.leagueId, "accepted")} disabled={respondingId === inv.inviteId} className="flex-1 py-2 bg-ml-success hover:bg-ml-success/80 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                    {respondingId === inv.inviteId ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : t("acceptInvite")}
                  </button>
                  <button onClick={() => handleInviteResponse(inv.inviteId, inv.leagueId, "declined")} disabled={respondingId === inv.inviteId} className="flex-1 py-2 bg-ml-dark-hover border border-ml-dark-border text-ml-gray-300 text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                    {t("declineInvite")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
