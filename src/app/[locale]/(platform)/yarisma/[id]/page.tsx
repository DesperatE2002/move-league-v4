"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Trophy, ArrowLeft, Loader2, MapPin, Calendar, Users, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompDetail {
  id: string;
  name: string;
  description: string | null;
  type: string;
  city: string | null;
  country: string | null;
  venue: string | null;
  startDate: string;
  endDate: string;
  maxTeams: number | null;
  registrationDeadline: string | null;
  status: string;
  registrations: {
    id: string;
    teamId: string;
    status: string;
    team: { name: string; logoUrl: string | null; city: string | null } | null;
  }[];
  results: {
    id: string;
    teamId: string;
    placement: number;
    totalScore: string | null;
    team: { name: string; logoUrl: string | null; city: string | null } | null;
  }[];
}

const medalColors = ["text-ml-gold", "text-ml-silver", "text-[#CD7F32]"];

export default function CompetitionDetailPage() {
  const t = useTranslations("competitions");
  const params = useParams();
  const locale = params.locale as string;
  const compId = params.id as string;

  const [comp, setComp] = useState<CompDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [compId]);

  async function fetchDetail() {
    try {
      const res = await fetch(`/api/competitions/${compId}`);
      if (res.ok) setComp(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-ml-gold animate-spin" />
      </div>
    );
  }

  if (!comp) {
    return (
      <div className="text-center py-10">
        <p className="text-ml-gray-400">{t("notFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <a href={`/${locale}/yarisma`} className="inline-flex items-center gap-1 text-sm text-ml-gray-400 hover:text-ml-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {t("backToList")}
      </a>

      {/* Header */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-5">
        <h1 className="text-xl font-bold text-ml-white mb-2">{comp.name}</h1>
        {comp.description && (
          <p className="text-sm text-ml-gray-300 mb-4">{comp.description}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-ml-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(comp.startDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
            {" - "}
            {new Date(comp.endDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
          {comp.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {comp.city}{comp.country ? `, ${comp.country}` : ""}
            </span>
          )}
          {comp.venue && <span>{comp.venue}</span>}
          <span className="px-2 py-0.5 rounded-full bg-ml-gold/10 text-ml-gold border border-ml-gold/20">
            {comp.type === "solo" ? t("solo") : t("team")}
          </span>
          {comp.registrationDeadline && (
            <span className="text-ml-warning">
              {t("deadline")}: {new Date(comp.registrationDeadline).toLocaleDateString("tr-TR")}
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {comp.results.length > 0 && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
          <h3 className="text-sm font-semibold text-ml-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-ml-gold" />
            {t("results")}
          </h3>
          <div className="space-y-2">
            {comp.results.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border",
                  r.placement <= 3 ? "border-ml-gold/20 bg-ml-gold/5" : "border-ml-dark-border"
                )}
              >
                <div className="w-8 text-center">
                  {r.placement <= 3 ? (
                    <Medal className={cn("w-5 h-5 mx-auto", medalColors[r.placement - 1])} />
                  ) : (
                    <span className="text-sm font-bold text-ml-gray-400">{r.placement}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ml-white">{r.team?.name || "-"}</p>
                  {r.team?.city && <p className="text-xs text-ml-gray-400">{r.team.city}</p>}
                </div>
                {r.totalScore && (
                  <span className="text-sm font-bold text-ml-gold">{r.totalScore}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registrations */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
        <h3 className="text-sm font-semibold text-ml-white flex items-center gap-2">
          <Users className="w-4 h-4 text-ml-info" />
          {t("registeredTeams")} ({comp.registrations.length})
        </h3>
        {comp.registrations.length === 0 ? (
          <p className="text-xs text-ml-gray-500">{t("noRegistrations")}</p>
        ) : (
          <div className="space-y-2">
            {comp.registrations.map((reg) => (
              <div key={reg.id} className="flex items-center gap-3 p-2 bg-ml-dark rounded-lg border border-ml-dark-border">
                <div className="w-8 h-8 rounded-lg bg-ml-info/20 flex items-center justify-center text-ml-info font-bold text-xs">
                  {reg.team?.name?.[0] || "?"}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ml-white">{reg.team?.name || "-"}</p>
                  {reg.team?.city && <p className="text-xs text-ml-gray-400">{reg.team.city}</p>}
                </div>
                <span className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                  reg.status === "approved" ? "bg-ml-success/10 text-ml-success border-ml-success/20" :
                  reg.status === "rejected" ? "bg-ml-red/10 text-ml-red border-ml-red/20" :
                  "bg-ml-warning/10 text-ml-warning border-ml-warning/20"
                )}>
                  {reg.status === "approved" ? t("approved") : reg.status === "rejected" ? t("rejected") : t("pending")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
