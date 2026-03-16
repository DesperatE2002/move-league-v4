"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  GraduationCap,
  Plus,
  Loader2,
  Star,
  Users,
  Clock,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DANCE_STYLES } from "@/lib/dance-styles";

interface WorkshopItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  danceStyle: string | null;
  difficulty: string | null;
  price: string;
  currency: string;
  maxParticipants: number | null;
  scheduledDate: string | null;
  durationMinutes: number | null;
  coach: { name: string; surname: string; username: string } | null;
  enrolledCount: number;
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-ml-success/10 text-ml-success border-ml-success/20",
  intermediate: "bg-ml-warning/10 text-ml-warning border-ml-warning/20",
  advanced: "bg-ml-red/10 text-ml-red border-ml-red/20",
};

export default function WorkshopsPage() {
  const t = useTranslations("workshops");
  const tNav = useTranslations("nav");
  const params = useParams();
  const locale = params.locale as string;

  const [workshops, setWorkshops] = useState<WorkshopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [styleFilter, setStyleFilter] = useState("");

  useEffect(() => {
    fetchWorkshops();
  }, [styleFilter]);

  async function fetchWorkshops() {
    setLoading(true);
    try {
      const qs = styleFilter ? `?style=${encodeURIComponent(styleFilter)}` : "";
      const res = await fetch(`/api/workshops${qs}`);
      if (res.ok) {
        const data = await res.json();
        setWorkshops(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ml-white">{tNav("workshops")}</h1>
        <a
          href={`/${locale}/atolyeler/olustur`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-ml-info hover:bg-ml-info/80 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-ml-info/20 active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          {t("create")}
        </a>
      </div>

      {/* Style Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStyleFilter("")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
            !styleFilter
              ? "bg-ml-info text-white"
              : "bg-ml-dark-card text-ml-gray-400 border border-ml-dark-border hover:border-ml-info/40"
          )}
        >
          {t("allStyles")}
        </button>
        {DANCE_STYLES.slice(0, 8).map((style) => (
          <button
            key={style}
            onClick={() => setStyleFilter(style === styleFilter ? "" : style)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              styleFilter === style
                ? "bg-ml-info text-white"
                : "bg-ml-dark-card text-ml-gray-400 border border-ml-dark-border hover:border-ml-info/40"
            )}
          >
            {style}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-info animate-spin" />
        </div>
      ) : workshops.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <div className="inline-flex p-4 rounded-full bg-ml-info/10 mb-4">
            <GraduationCap className="w-8 h-8 text-ml-info" />
          </div>
          <h2 className="text-lg font-semibold text-ml-white mb-2">{t("noWorkshops")}</h2>
          <p className="text-sm text-ml-gray-400">{t("noWorkshopsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {workshops.map((w) => (
            <a
              key={w.id}
              href={`/${locale}/atolyeler/${w.id}`}
              className="block bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 hover:border-ml-info/30 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-ml-white line-clamp-1">{w.title}</h3>
                {w.difficulty && (
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", difficultyColors[w.difficulty] || "")}>
                    {t(w.difficulty)}
                  </span>
                )}
              </div>

              {w.description && (
                <p className="text-xs text-ml-gray-400 line-clamp-2 mb-3">{w.description}</p>
              )}

              <div className="flex items-center gap-3 text-xs text-ml-gray-500 mb-2">
                {w.danceStyle && (
                  <span className="px-2 py-0.5 rounded-full bg-ml-info/10 text-ml-info border border-ml-info/20">
                    {w.danceStyle}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {w.type === "live" ? t("live") : t("video")}
                </span>
                {w.durationMinutes && <span>{w.durationMinutes} dk</span>}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-ml-dark-border">
                <span className="text-xs text-ml-gray-400">
                  {w.coach ? `${w.coach.name} ${w.coach.surname}` : ""}
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-ml-gray-400">
                    <Users className="w-3 h-3" />
                    {w.enrolledCount}{w.maxParticipants ? `/${w.maxParticipants}` : ""}
                  </span>
                  <span className="text-sm font-bold text-ml-info">
                    {Number(w.price) > 0 ? `${w.price} ${w.currency}` : t("free")}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
