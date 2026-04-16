"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Crown, Loader2, Calendar, Users, Shield, ChevronRight,
  Play, CheckCircle, XCircle, ArrowLeft,
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
  memberCount: number;
  ownerName?: string;
  ownerSurname?: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-ml-warning/20 text-ml-warning",
  active: "bg-ml-success/20 text-ml-success",
  completed: "bg-ml-gray-400/20 text-ml-gray-400",
  cancelled: "bg-ml-error/20 text-ml-error",
};

export default function AdminLeaguesPage() {
  const t = useTranslations("leagues");
  const tAdmin = useTranslations("admin");
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const locale = params.locale as string;

  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchLeagues(); }, []);

  async function fetchLeagues() {
    try {
      const res = await fetch("/api/leagues");
      if (res.ok) {
        const data = await res.json();
        setLeagues(data.leagues || []);
      }
    } catch {} finally { setLoading(false); }
  }

  async function handleAction(leagueId: string, action: "activate" | "complete" | "cancel") {
    setActionLoading(leagueId);
    try {
      const body: Record<string, string> = { action };
      if (action === "cancel") body.action = "complete"; // reuse complete; status handled by API
      await fetch(`/api/leagues/${leagueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      fetchLeagues();
    } catch {} finally { setActionLoading(null); }
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 text-ml-gray-500 mx-auto mb-4" />
        <p className="text-ml-gray-400">{tAdmin("noAccess")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(`/${locale}/admin`)} className="p-2 hover:bg-ml-dark-hover rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5 text-ml-gray-400" />
        </button>
        <Crown className="w-5 h-5 text-ml-gold" />
        <h1 className="text-xl font-bold text-ml-white">{t("adminTitle")}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-gold animate-spin" />
        </div>
      ) : leagues.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <Crown className="w-8 h-8 text-ml-gold mx-auto mb-4" />
          <p className="text-sm text-ml-gray-400">{t("noLeagues")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leagues.map((league) => (
            <div key={league.id} className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <a href={`/${locale}/ozel-ligler/${league.id}`} className="text-sm font-bold text-ml-white hover:text-ml-gold transition-colors">
                    {league.name}
                  </a>
                  {league.ownerName && (
                    <p className="text-[10px] text-ml-gray-500">{league.ownerName} {league.ownerSurname}</p>
                  )}
                </div>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", statusColors[league.status] || "")}>
                  {league.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-ml-gray-400 mb-3">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{league.memberCount}/{league.maxMembers}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(league.startDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} - {new Date(league.endDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
              </div>
              <div className="flex gap-2">
                {league.status === "draft" && (
                  <button onClick={() => handleAction(league.id, "activate")} disabled={actionLoading === league.id} className="inline-flex items-center gap-1 px-3 py-1 bg-ml-success/20 text-ml-success text-xs font-medium rounded-lg hover:bg-ml-success/30 transition-all disabled:opacity-50">
                    {actionLoading === league.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    {t("activate")}
                  </button>
                )}
                {league.status === "active" && (
                  <button onClick={() => handleAction(league.id, "complete")} disabled={actionLoading === league.id} className="inline-flex items-center gap-1 px-3 py-1 bg-ml-gray-400/20 text-ml-gray-300 text-xs font-medium rounded-lg hover:bg-ml-gray-400/30 transition-all disabled:opacity-50">
                    {actionLoading === league.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                    {t("complete")}
                  </button>
                )}
                <a href={`/${locale}/ozel-ligler/${league.id}`} className="inline-flex items-center gap-1 px-3 py-1 bg-ml-gold/20 text-ml-gold text-xs font-medium rounded-lg hover:bg-ml-gold/30 transition-all">
                  <ChevronRight className="w-3 h-3" /> {t("viewDetails")}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
