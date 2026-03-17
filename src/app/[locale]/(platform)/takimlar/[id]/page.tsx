"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Users, ArrowLeft, Loader2, MapPin, UserPlus, Check, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  userId: string;
  status: string;
  joinedAt: string;
  user: { name: string; surname: string; username: string; avatarUrl: string | null } | null;
}

interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  city: string | null;
  country: string | null;
  coach: { id: string; name: string; surname: string; username: string; avatarUrl: string | null } | null;
  members: TeamMember[];
  myMembership: { id: string; userId: string; status: string } | null;
  isCoach: boolean;
}

interface SearchUser {
  id: string;
  name: string;
  surname: string;
  username: string;
}

export default function TeamDetailPage() {
  const t = useTranslations("teams");
  const params = useParams();
  const locale = params.locale as string;
  const teamId = params.id as string;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  async function fetchTeam() {
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.ok) setTeam(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function searchUsers() {
    if (searchQuery.length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch {
      // silent
    } finally {
      setSearching(false);
    }
  }

  async function inviteMember(userId: string) {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        fetchTeam();
        setSearchResults([]);
        setSearchQuery("");
      }
    } catch {
      // silent
    }
  }

  async function handleMemberAction(action: "accept" | "decline") {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) fetchTeam();
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-10">
        <p className="text-ml-gray-400">{t("notFound")}</p>
      </div>
    );
  }

  const activeMembers = team.members.filter((m) => m.status === "active");
  const invitedMembers = team.members.filter((m) => m.status === "invited");

  return (
    <div className="space-y-4 animate-fade-in">
      <a href={`/${locale}/takimlar`} className="inline-flex items-center gap-1 text-sm text-ml-gray-400 hover:text-ml-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {t("backToList")}
      </a>

      {/* Header */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-5">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-2xl">
            {team.logoUrl ? (
              <img src={team.logoUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              team.name[0]
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-ml-white">{team.name}</h1>
            {team.city && (
              <p className="text-xs text-ml-gray-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {team.city}{team.country ? `, ${team.country}` : ""}
              </p>
            )}
          </div>
        </div>
        {team.description && (
          <p className="text-sm text-ml-gray-300">{team.description}</p>
        )}
      </div>

      {/* Coach */}
      {team.coach && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
            {team.coach.name[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-ml-white">{team.coach.name} {team.coach.surname}</p>
            <p className="text-xs text-ml-gray-400">@{team.coach.username} · {t("coach")}</p>
          </div>
        </div>
      )}

      {/* My invite */}
      {team.myMembership?.status === "invited" && (
        <div className="bg-purple-500/10 rounded-xl border border-purple-500/30 p-4">
          <p className="text-sm text-purple-300 mb-3">{t("invitedMsg")}</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleMemberAction("accept")}
              className="flex items-center gap-1 px-4 py-2 bg-ml-success/20 text-ml-success text-sm font-medium rounded-lg border border-ml-success/30"
            >
              <Check className="w-4 h-4" /> {t("acceptInvite")}
            </button>
            <button
              onClick={() => handleMemberAction("decline")}
              className="flex items-center gap-1 px-4 py-2 bg-ml-red/20 text-ml-red text-sm font-medium rounded-lg border border-ml-red/30"
            >
              <X className="w-4 h-4" /> {t("declineInvite")}
            </button>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ml-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            {t("members")} ({activeMembers.length})
          </h3>
          {team.isCoach && (
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-purple-400 bg-purple-500/10 rounded-lg border border-purple-500/20 hover:bg-purple-500/20 transition-all"
            >
              <UserPlus className="w-3 h-3" />
              {t("invite")}
            </button>
          )}
        </div>

        {/* Invite search */}
        {showInvite && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                placeholder={t("searchMember")}
                className="flex-1 px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button onClick={searchUsers} className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                <Search className="w-4 h-4" />
              </button>
            </div>
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-2 bg-ml-dark rounded-lg">
                <span className="text-sm text-ml-white">{u.name} {u.surname} (@{u.username})</span>
                <button
                  onClick={() => inviteMember(u.id)}
                  className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-lg"
                >
                  {t("invite")}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeMembers.length === 0 ? (
          <p className="text-xs text-ml-gray-500">{t("noMembers")}</p>
        ) : (
          <div className="space-y-2">
            {activeMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2 bg-ml-dark rounded-lg">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                  {m.user?.name?.[0] || "?"}
                </div>
                <div>
                  <p className="text-sm text-ml-white">{m.user?.name} {m.user?.surname}</p>
                  <p className="text-xs text-ml-gray-400">@{m.user?.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {invitedMembers.length > 0 && (
          <>
            <h4 className="text-xs font-medium text-ml-gray-400 mt-2">{t("pendingInvites")}</h4>
            <div className="space-y-1">
              {invitedMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2 bg-ml-dark/50 rounded-lg opacity-60">
                  <div className="w-8 h-8 rounded-full bg-ml-dark-border flex items-center justify-center text-ml-gray-500 font-bold text-xs">
                    {m.user?.name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="text-sm text-ml-gray-300">{m.user?.name} {m.user?.surname}</p>
                    <p className="text-xs text-ml-gray-500">{t("invited")}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
