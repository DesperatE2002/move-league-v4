"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Shield,
  Gavel,
  ArrowLeft,
  Loader2,
  Search,
  UserPlus,
  CheckCircle,
} from "lucide-react";

interface Judge {
  id: string;
  name: string;
  surname: string;
  username: string;
}

interface UserItem {
  id: string;
  name: string;
  surname: string;
  username: string;
  role: string;
}

export default function AdminJudgesPage() {
  const t = useTranslations("admin");
  const params = useParams();
  const { data: session } = useSession();
  const locale = params.locale as string;

  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [promoted, setPromoted] = useState<string | null>(null);

  useEffect(() => {
    fetchJudges();
  }, []);

  async function fetchJudges() {
    try {
      const res = await fetch("/api/admin/judges");
      if (res.ok) {
        const data = await res.json();
        setJudges(data.judges || []);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }

  async function searchUsers() {
    if (!search.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(
          (data.users || []).filter(
            (u: UserItem) => u.role !== "judge" && u.role !== "admin"
          )
        );
      }
    } catch {
      // fail
    } finally {
      setSearchLoading(false);
    }
  }

  async function promoteToJudge(userId: string) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: "judge" }),
      });
      if (res.ok) {
        setPromoted(userId);
        fetchJudges();
        setSearchResults((prev) => prev.filter((u) => u.id !== userId));
        setTimeout(() => setPromoted(null), 2000);
      }
    } catch {
      // fail
    }
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 text-ml-gray-500 mx-auto mb-4" />
        <p className="text-ml-gray-400">{t("noAccess")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <a
          href={`/${locale}/admin`}
          className="text-ml-gray-400 hover:text-ml-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </a>
        <Gavel className="w-5 h-5 text-ml-red" />
        <h1 className="text-xl font-bold text-ml-white">
          {locale === "tr" ? "Hakem Yönetimi" : "Judge Management"}
        </h1>
      </div>

      {/* Search to add judge */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
        <h3 className="text-sm font-semibold text-ml-white flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-ml-red" />
          {locale === "tr" ? "Hakem Ekle" : "Add Judge"}
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchUsers()}
            placeholder={t("searchUsers")}
            className="flex-1 px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white placeholder-ml-gray-500 focus:outline-none focus:border-ml-red/50"
          />
          <button
            onClick={searchUsers}
            disabled={searchLoading}
            className="px-4 py-2 bg-ml-red text-white rounded-lg text-sm font-medium hover:bg-ml-red-dark transition-colors disabled:opacity-50"
          >
            {searchLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-ml-dark rounded-lg border border-ml-dark-border"
              >
                <div>
                  <p className="text-sm font-medium text-ml-white">
                    {user.name} {user.surname}
                  </p>
                  <p className="text-xs text-ml-gray-400">
                    @{user.username} · {user.role}
                  </p>
                </div>
                <button
                  onClick={() => promoteToJudge(user.id)}
                  className="px-3 py-1.5 bg-ml-red/10 text-ml-red border border-ml-red/20 rounded-lg text-xs font-medium hover:bg-ml-red/20 transition-colors"
                >
                  {promoted === user.id ? (
                    <CheckCircle className="w-4 h-4 text-ml-success" />
                  ) : (
                    locale === "tr" ? "Hakem Yap" : "Make Judge"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current judges */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4">
        <h3 className="text-sm font-semibold text-ml-white mb-3">
          {locale === "tr" ? "Mevcut Hakemler" : "Current Judges"} ({judges.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
          </div>
        ) : judges.length === 0 ? (
          <p className="text-sm text-ml-gray-500 text-center py-4">
            {locale === "tr" ? "Henüz hakem yok" : "No judges yet"}
          </p>
        ) : (
          <div className="space-y-2">
            {judges.map((judge) => (
              <div
                key={judge.id}
                className="flex items-center gap-3 p-3 bg-ml-dark rounded-lg border border-ml-dark-border"
              >
                <div className="w-8 h-8 rounded-full bg-ml-red/10 flex items-center justify-center">
                  <Gavel className="w-4 h-4 text-ml-red" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ml-white">
                    {judge.name} {judge.surname}
                  </p>
                  <p className="text-xs text-ml-gray-400">@{judge.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
