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

export default function AdminBadgesPage() {
  const t = useTranslations("admin");
  const params = useParams();
  const { data: session } = useSession();
  const locale = params.locale as string;

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
            <div
              key={badge.id}
              className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ml-white">
                  {locale === "tr" ? badge.nameTr : badge.nameEn}
                </p>
                <p className="text-xs text-ml-gray-400 truncate">
                  {locale === "tr" ? badge.descriptionTr : badge.descriptionEn}
                </p>
              </div>
              <span className="text-xs text-ml-gray-500 font-mono">{badge.key}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
