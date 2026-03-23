"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Calendar,
  ArrowLeft,
  Loader2,
  Shield,
  Plus,
  CheckCircle,
  Circle,
  Trash2,
  X,
  Trophy,
  Medal,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  firstPrize: string | null;
  secondPrize: string | null;
  thirdPrize: string | null;
  createdAt: string;
}

export default function AdminSeasonsPage() {
  const t = useTranslations("admin");
  const params = useParams();
  const { data: session } = useSession();
  const locale = params.locale as string;

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", firstPrize: "", secondPrize: "", thirdPrize: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const isTr = locale === "tr";

  useEffect(() => {
    fetchSeasons();
  }, []);

  async function fetchSeasons() {
    try {
      const res = await fetch("/api/seasons");
      if (res.ok) {
        const data = await res.json();
        setSeasons(data.seasons);
      }
    } catch {
      // fail
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.name || !form.startDate || !form.endDate) return;
    setCreating(true);
    try {
      const res = await fetch("/api/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: "", startDate: "", endDate: "", firstPrize: "", secondPrize: "", thirdPrize: "" });
        fetchSeasons();
      }
    } catch {
      // fail
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/seasons?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSeasons((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // fail
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
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
          <h1 className="text-xl font-bold text-ml-white">{t("seasonManagement")}</h1>
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
        <div className="bg-ml-dark-card rounded-xl border border-ml-gold/30 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-ml-white">{t("newSeason")}</h3>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("seasonName")}
            className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-gold/40"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-ml-gray-400 mb-1 block">{t("startDate")}</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white"
              />
            </div>
            <div>
              <label className="text-xs text-ml-gray-400 mb-1 block">{t("endDate")}</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white"
              />
            </div>
          </div>

          {/* Prizes */}
          <div className="border-t border-ml-dark-border pt-3 space-y-2">
            <p className="text-xs font-semibold text-ml-gold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              {isTr ? "Sezon Ödülleri" : "Season Prizes"}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm">🥇</span>
              <input
                type="text"
                value={form.firstPrize}
                onChange={(e) => setForm({ ...form, firstPrize: e.target.value })}
                placeholder={isTr ? "1. ödül (ör: Altın Kupa + 1000 TL)" : "1st prize"}
                className="flex-1 bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-gold/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">🥈</span>
              <input
                type="text"
                value={form.secondPrize}
                onChange={(e) => setForm({ ...form, secondPrize: e.target.value })}
                placeholder={isTr ? "2. ödül" : "2nd prize"}
                className="flex-1 bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-gold/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">🥉</span>
              <input
                type="text"
                value={form.thirdPrize}
                onChange={(e) => setForm({ ...form, thirdPrize: e.target.value })}
                placeholder={isTr ? "3. ödül" : "3rd prize"}
                className="flex-1 bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-gold/40"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !form.name || !form.startDate || !form.endDate}
            className="w-full py-2.5 bg-ml-gold hover:bg-ml-gold/80 text-black font-semibold rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t("createSeason")}
          </button>
        </div>
      )}

      {/* Seasons List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : seasons.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <Calendar className="w-8 h-8 text-ml-gray-500 mx-auto mb-2" />
          <p className="text-sm text-ml-gray-400">{t("noSeasons")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {seasons.map((season) => (
            <div
              key={season.id}
              className={cn(
                "bg-ml-dark-card rounded-xl border p-4",
                season.isActive ? "border-ml-gold/30" : "border-ml-dark-border"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {season.isActive ? (
                    <CheckCircle className="w-4 h-4 text-ml-gold shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-ml-gray-500 shrink-0" />
                  )}
                  <span className="text-sm font-semibold text-ml-white truncate">{season.name}</span>
                  {season.isActive && (
                    <span className="text-xs bg-ml-gold/10 text-ml-gold px-2 py-0.5 rounded-full font-medium shrink-0">
                      {t("active")}
                    </span>
                  )}
                </div>

                {/* Delete */}
                {confirmDeleteId === season.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDelete(season.id)}
                      disabled={deletingId === season.id}
                      className="px-2 py-1 rounded bg-ml-error text-white text-[10px] font-bold disabled:opacity-50"
                    >
                      {deletingId === season.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (isTr ? "Evet" : "Yes")}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 rounded bg-ml-dark-hover text-ml-gray-400 text-[10px] font-bold"
                    >
                      {isTr ? "İptal" : "Cancel"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(season.id)}
                    className="p-1.5 rounded-lg text-ml-error hover:bg-ml-error/20 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-ml-gray-400 mt-2 ml-6">
                {new Date(season.startDate).toLocaleDateString("tr-TR")} — {new Date(season.endDate).toLocaleDateString("tr-TR")}
              </p>

              {/* Prizes */}
              {(season.firstPrize || season.secondPrize || season.thirdPrize) && (
                <div className="mt-2 ml-6 space-y-0.5">
                  {season.firstPrize && (
                    <p className="text-xs text-ml-gold">🥇 {season.firstPrize}</p>
                  )}
                  {season.secondPrize && (
                    <p className="text-xs text-ml-gray-300">🥈 {season.secondPrize}</p>
                  )}
                  {season.thirdPrize && (
                    <p className="text-xs text-ml-gray-400">🥉 {season.thirdPrize}</p>
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
