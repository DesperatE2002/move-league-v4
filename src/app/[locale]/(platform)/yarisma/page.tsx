"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Trophy, Loader2, MapPin, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompetitionItem {
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
  status: string;
  registrationCount: number;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  upcoming: { label: "Yaklaşan", color: "bg-ml-info/10 text-ml-info border-ml-info/20" },
  registration_open: { label: "Kayıtlar Açık", color: "bg-ml-success/10 text-ml-success border-ml-success/20" },
  registration_closed: { label: "Kayıtlar Kapandı", color: "bg-ml-warning/10 text-ml-warning border-ml-warning/20" },
  in_progress: { label: "Devam Ediyor", color: "bg-ml-red/10 text-ml-red border-ml-red/20" },
  completed: { label: "Tamamlandı", color: "bg-ml-gray-500/10 text-ml-gray-400 border-ml-gray-500/20" },
  cancelled: { label: "İptal", color: "bg-ml-gray-500/10 text-ml-gray-500 border-ml-gray-500/20" },
};

export default function CompetitionsPage() {
  const t = useTranslations("competitions");
  const tNav = useTranslations("nav");
  const params = useParams();
  const locale = params.locale as string;

  const [competitions, setCompetitions] = useState<CompetitionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  async function fetchCompetitions() {
    try {
      const res = await fetch("/api/competitions");
      if (res.ok) setCompetitions(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-ml-gold" />
        <h1 className="text-xl font-bold text-ml-white">{tNav("competitions")}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-gold animate-spin" />
        </div>
      ) : competitions.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <div className="inline-flex p-4 rounded-full bg-ml-gold/10 mb-4">
            <Trophy className="w-8 h-8 text-ml-gold" />
          </div>
          <h2 className="text-lg font-semibold text-ml-white mb-2">{t("noCompetitions")}</h2>
          <p className="text-sm text-ml-gray-400">{t("noCompetitionsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {competitions.map((comp) => {
            const st = statusLabels[comp.status] || statusLabels.upcoming;
            return (
              <a
                key={comp.id}
                href={`/${locale}/yarisma/${comp.id}`}
                className="block bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 hover:border-ml-gold/30 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-ml-white line-clamp-1">{comp.name}</h3>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ml-2", st.color)}>
                    {st.label}
                  </span>
                </div>

                {comp.description && (
                  <p className="text-xs text-ml-gray-400 line-clamp-2 mb-3">{comp.description}</p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-ml-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(comp.startDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    {" - "}
                    {new Date(comp.endDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {comp.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {comp.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {comp.registrationCount}{comp.maxTeams ? `/${comp.maxTeams}` : ""} {t("teams")}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-ml-gold/10 text-ml-gold border border-ml-gold/20">
                    {comp.type === "solo" ? t("solo") : t("team")}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
