"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Award,
  ArrowLeft,
  Loader2,
  Shield,
  Plus,
  Search,
  UserPlus,
  CheckCircle,
  X,
} from "lucide-react";

interface Badge {
  id: string;
  key: string;
  nameTr: string;
  nameEn: string;
  descriptionTr: string | null;
  descriptionEn: string | null;
  iconUrl: string | null;
}

interface UserResult {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
}

export default function AdminBadgesPage() {
  const t = useTranslations("admin");
  const params = useParams();
  const { data: session } = useSession();
  const locale = params.locale as string;
  const isTr = locale === "tr";

  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    key: "",
    nameTr: "",
    nameEn: "",
    descriptionTr: "",
    descriptionEn: "",
  });

  // Badge assignment state
  const [assigningBadgeId, setAssigningBadgeId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetchBadges();
  }, []);

  async function fetchBadges() {
    try {
      const res = await fetch("/api/badges");
      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges);
      }
    } catch {
      // fail
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.key || !form.nameTr || !form.nameEn) return;
    setCreating(true);
    try {
      const res = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ key: "", nameTr: "", nameEn: "", descriptionTr: "", descriptionEn: "" });
        fetchBadges();
      }
    } catch {
      // fail
    } finally {
      setCreating(false);
    }
  }

  async function searchUsers(q: string) {
    setUserSearch(q);
    if (q.length < 2) { setUserResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setUserResults(data.users || []);
      }
    } catch {
      // fail
    } finally {
      setSearching(false);
    }
  }

  async function assignBadge(userId: string) {
    if (!assigningBadgeId) return;
    setAssigning(true);
    setAssignMsg(null);
    try {
      const res = await fetch(`/api/users/${userId}/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeId: assigningBadgeId }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssignMsg({ type: "ok", text: isTr ? "Rozet başarıyla verildi!" : "Badge assigned!" });
      } else {
        setAssignMsg({ type: "err", text: data.error || (isTr ? "Hata oluştu" : "Error") });
      }
    } catch {
      setAssignMsg({ type: "err", text: isTr ? "Hata oluştu" : "Error" });
    } finally {
      setAssigning(false);
    }
  }

  function closeAssign() {
    setAssigningBadgeId(null);
    setUserSearch("");
    setUserResults([]);
    setAssignMsg(null);
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
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href={`/${locale}/admin`} className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-card transition-all">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <h1 className="text-xl font-bold text-ml-white">{t("badgeManagement")}</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 rounded-lg bg-ml-red text-white hover:bg-ml-red/80 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-ml-dark-card rounded-xl border border-purple-500/30 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-ml-white">{t("newBadge")}</h3>
          <input
            type="text"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            placeholder="Badge key (e.g. first_win)"
            className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={form.nameTr}
              onChange={(e) => setForm({ ...form, nameTr: e.target.value })}
              placeholder={t("badgeNameTr")}
              className="bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-500"
            />
            <input
              type="text"
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              placeholder={t("badgeNameEn")}
              className="bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={form.descriptionTr}
              onChange={(e) => setForm({ ...form, descriptionTr: e.target.value })}
              placeholder={t("badgeDescTr")}
              className="bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-500"
            />
            <input
              type="text"
              value={form.descriptionEn}
              onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
              placeholder={t("badgeDescEn")}
              className="bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-500"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !form.key || !form.nameTr || !form.nameEn}
            className="w-full py-2.5 bg-purple-500 hover:bg-purple-500/80 text-white font-semibold rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t("createBadge")}
          </button>
        </div>
      )}

      {/* Badges List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : badges.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <Award className="w-8 h-8 text-ml-gray-500 mx-auto mb-2" />
          <p className="text-sm text-ml-gray-400">{t("noBadges")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {badges.map((badge) => (
            <div key={badge.id} className="bg-ml-dark-card rounded-xl border border-ml-dark-border overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ml-white">
                    {isTr ? badge.nameTr : badge.nameEn}
                  </p>
                  <p className="text-xs text-ml-gray-400 truncate">
                    {isTr ? badge.descriptionTr : badge.descriptionEn}
                  </p>
                </div>
                <span className="text-xs text-ml-gray-500 font-mono mr-2">{badge.key}</span>
                <button
                  onClick={() => { assigningBadgeId === badge.id ? closeAssign() : (closeAssign(), setAssigningBadgeId(badge.id)); }}
                  className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all text-xs flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">{isTr ? "Ver" : "Assign"}</span>
                </button>
              </div>

              {/* Assignment panel for this badge */}
              {assigningBadgeId === badge.id && (
                <div className="border-t border-ml-dark-border p-4 space-y-3 bg-ml-dark/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-purple-400">
                      {isTr ? "Kullanıcıya Rozet Ver" : "Assign Badge to User"}
                    </h4>
                    <button onClick={closeAssign} className="p-1 rounded text-ml-gray-500 hover:text-ml-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ml-gray-500" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => searchUsers(e.target.value)}
                      placeholder={isTr ? "Kullanıcı ara (isim, email, username)..." : "Search user..."}
                      className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-lg pl-10 pr-4 py-2 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                    />
                    {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 animate-spin" />}
                  </div>

                  {assignMsg && (
                    <div className={`p-2 rounded-lg text-xs text-center ${assignMsg.type === "ok" ? "bg-ml-success/10 text-ml-success border border-ml-success/20" : "bg-ml-red/10 text-ml-red border border-ml-red/20"}`}>
                      {assignMsg.type === "ok" && <CheckCircle className="w-3 h-3 inline mr-1" />}
                      {assignMsg.text}
                    </div>
                  )}

                  {userResults.length > 0 && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {userResults.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-2 bg-ml-dark rounded-lg border border-ml-dark-border">
                          <div>
                            <p className="text-sm text-ml-white">{u.name} {u.surname}</p>
                            <p className="text-[11px] text-ml-gray-500">@{u.username} · {u.email}</p>
                          </div>
                          <button
                            onClick={() => assignBadge(u.id)}
                            disabled={assigning}
                            className="px-3 py-1.5 bg-purple-500 hover:bg-purple-500/80 text-white text-xs font-medium rounded-lg disabled:opacity-50 flex items-center gap-1"
                          >
                            {assigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Award className="w-3 h-3" />}
                            {isTr ? "Ver" : "Give"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
