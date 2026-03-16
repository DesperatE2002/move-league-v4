"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, Plus, Loader2, MapPin } from "lucide-react";

interface TeamItem {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  city: string | null;
  country: string | null;
  coach: { name: string; surname: string; username: string } | null;
  memberCount: number;
}

export default function TeamsPage() {
  const t = useTranslations("teams");
  const tNav = useTranslations("nav");
  const { data: session } = useSession();
  const params = useParams();
  const locale = params.locale as string;
  const isCoach = session?.user?.role === "coach" || session?.user?.role === "admin";

  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) setTeams(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ml-white">{tNav("teams")}</h1>
        {isCoach && (
          <a
            href={`/${locale}/takimlar/olustur`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            {t("createTeam")}
          </a>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <div className="inline-flex p-4 rounded-full bg-purple-500/10 mb-4">
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-ml-white mb-2">{t("noTeams")}</h2>
          <p className="text-sm text-ml-gray-400">{t("noTeamsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {teams.map((team) => (
            <a
              key={team.id}
              href={`/${locale}/takimlar/${team.id}`}
              className="block bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    team.name[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-ml-white truncate">{team.name}</h3>
                  <p className="text-xs text-ml-gray-400">
                    {team.coach ? `${t("coach")}: ${team.coach.name} ${team.coach.surname}` : ""}
                  </p>
                </div>
              </div>

              {team.description && (
                <p className="text-xs text-ml-gray-400 line-clamp-2 mb-2">{team.description}</p>
              )}

              <div className="flex items-center gap-3 text-xs text-ml-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {team.memberCount} {t("members")}
                </span>
                {team.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {team.city}{team.country ? `, ${team.country}` : ""}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
