"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Shield,
  Medal,
  ArrowLeft,
  Loader2,
  Plus,
  ChevronRight,
  MapPin,
  Calendar,
  Users,
} from "lucide-react";

interface Competition {
  id: string;
  name: string;
  type: string;
  city: string | null;
  country: string | null;
  startDate: string;
  endDate: string;
  status: string;
  maxTeams: number | null;
}

export default function AdminCompetitionsPage() {
  const t = useTranslations("admin");
  const ct = useTranslations("competitions");
  const params = useParams();
  const { data: session } = useSession();
  const locale = params.locale as string;

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "solo" as "solo" | "team",
    city: "",
    country: "",
    venue: "",
    startDate: "",
    endDate: "",
    maxTeams: "",
    registrationDeadline: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  async function fetchCompetitions() {
    try {
      const res = await fetch("/api/competitions");
      if (res.ok) {
        const data = await res.json();
        setCompetitions(data);
      }
    } catch {
      // fail
    } finally {
      setLoading(false);
    }
  }

  async function createCompetition() {
    if (!form.name || !form.startDate || !form.endDate) return;
    setCreating(true);
    try {
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          maxTeams: form.maxTeams ? parseInt(form.maxTeams) : undefined,
          registrationDeadline: form.registrationDeadline || undefined,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({
          name: "",
          description: "",
          type: "solo",
          city: "",
          country: "",
          venue: "",
          startDate: "",
          endDate: "",
          maxTeams: "",
          registrationDeadline: "",
        });
        fetchCompetitions();
      }
    } catch {
      // fail
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/competitions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchCompetitions();
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

  const statusColors: Record<string, string> = {
    upcoming: "text-ml-info bg-ml-info/10 border-ml-info/20",
    registration_open: "text-ml-success bg-ml-success/10 border-ml-success/20",
    registration_closed: "text-ml-gold bg-ml-gold/10 border-ml-gold/20",
    in_progress: "text-ml-red bg-ml-red/10 border-ml-red/20",
    completed: "text-ml-gray-400 bg-ml-gray-500/10 border-ml-gray-500/20",
    cancelled: "text-ml-error bg-ml-error/10 border-ml-error/20",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href={`/${locale}/admin`}
            className="text-ml-gray-400 hover:text-ml-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
          <Medal className="w-5 h-5 text-ml-red" />
          <h1 className="text-xl font-bold text-ml-white">
            {locale === "tr" ? "Yarışma Yönetimi" : "Competition Management"}
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-2 bg-ml-red text-white rounded-lg text-sm font-medium hover:bg-ml-red-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          {locale === "tr" ? "Yeni" : "New"}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={locale === "tr" ? "Yarışma adı" : "Competition name"}
            className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white placeholder-ml-gray-500 focus:outline-none focus:border-ml-red/50"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={locale === "tr" ? "Açıklama" : "Description"}
            rows={2}
            className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white placeholder-ml-gray-500 focus:outline-none focus:border-ml-red/50 resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "solo" | "team" })}
              className="px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white focus:outline-none focus:border-ml-red/50"
            >
              <option value="solo">{ct("solo")}</option>
              <option value="team">{ct("team")}</option>
            </select>
            <input
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder={locale === "tr" ? "Mekan" : "Venue"}
              className="px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white placeholder-ml-gray-500 focus:outline-none focus:border-ml-red/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder={locale === "tr" ? "Şehir" : "City"}
              className="px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white placeholder-ml-gray-500 focus:outline-none focus:border-ml-red/50"
            />
            <input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder={locale === "tr" ? "Ülke" : "Country"}
              className="px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white placeholder-ml-gray-500 focus:outline-none focus:border-ml-red/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-ml-gray-500 mb-1 block">
                {locale === "tr" ? "Başlangıç" : "Start"}
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white focus:outline-none focus:border-ml-red/50"
              />
            </div>
            <div>
              <label className="text-xs text-ml-gray-500 mb-1 block">
                {locale === "tr" ? "Bitiş" : "End"}
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white focus:outline-none focus:border-ml-red/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={form.maxTeams}
              onChange={(e) => setForm({ ...form, maxTeams: e.target.value })}
              placeholder={locale === "tr" ? "Maks takım" : "Max teams"}
              className="px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white placeholder-ml-gray-500 focus:outline-none focus:border-ml-red/50"
            />
            <div>
              <input
                type="date"
                value={form.registrationDeadline}
                onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                placeholder={locale === "tr" ? "Son kayıt" : "Deadline"}
                className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white focus:outline-none focus:border-ml-red/50"
              />
            </div>
          </div>
          <button
            onClick={createCompetition}
            disabled={creating || !form.name || !form.startDate || !form.endDate}
            className="w-full py-2.5 bg-ml-red text-white rounded-lg text-sm font-semibold hover:bg-ml-red-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
            {locale === "tr" ? "Yarışma Oluştur" : "Create Competition"}
          </button>
        </div>
      )}

      {/* Competition list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : competitions.length === 0 ? (
        <div className="text-center py-10">
          <Medal className="w-10 h-10 text-ml-gray-600 mx-auto mb-3" />
          <p className="text-sm text-ml-gray-500">
            {ct("noCompetitions")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {competitions.map((comp) => (
            <div
              key={comp.id}
              className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ml-white">{comp.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        statusColors[comp.status] || "text-ml-gray-400"
                      }`}
                    >
                      {comp.status}
                    </span>
                    <span className="text-xs text-ml-gray-400">
                      {comp.type === "solo" ? ct("solo") : ct("team")}
                    </span>
                  </div>
                </div>
                <a
                  href={`/${locale}/yarisma/${comp.id}`}
                  className="text-ml-gray-400 hover:text-ml-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-ml-gray-400">
                {comp.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {comp.city}{comp.country && `, ${comp.country}`}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {comp.startDate} — {comp.endDate}
                </span>
                {comp.maxTeams && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {locale === "tr" ? `Maks ${comp.maxTeams}` : `Max ${comp.maxTeams}`}
                  </span>
                )}
              </div>

              {/* Status actions */}
              <div className="flex gap-2">
                {comp.status === "upcoming" && (
                  <button
                    onClick={() => updateStatus(comp.id, "registration_open")}
                    className="px-3 py-1.5 bg-ml-success/10 text-ml-success border border-ml-success/20 rounded-lg text-xs font-medium hover:bg-ml-success/20 transition-colors"
                  >
                    {locale === "tr" ? "Kayıtları Aç" : "Open Registration"}
                  </button>
                )}
                {comp.status === "registration_open" && (
                  <button
                    onClick={() => updateStatus(comp.id, "registration_closed")}
                    className="px-3 py-1.5 bg-ml-gold/10 text-ml-gold border border-ml-gold/20 rounded-lg text-xs font-medium hover:bg-ml-gold/20 transition-colors"
                  >
                    {locale === "tr" ? "Kayıtları Kapat" : "Close Registration"}
                  </button>
                )}
                {comp.status === "registration_closed" && (
                  <button
                    onClick={() => updateStatus(comp.id, "in_progress")}
                    className="px-3 py-1.5 bg-ml-red/10 text-ml-red border border-ml-red/20 rounded-lg text-xs font-medium hover:bg-ml-red/20 transition-colors"
                  >
                    {locale === "tr" ? "Başlat" : "Start"}
                  </button>
                )}
                {comp.status !== "completed" && comp.status !== "cancelled" && (
                  <button
                    onClick={() => updateStatus(comp.id, "cancelled")}
                    className="px-3 py-1.5 bg-ml-error/10 text-ml-error border border-ml-error/20 rounded-lg text-xs font-medium hover:bg-ml-error/20 transition-colors"
                  >
                    {locale === "tr" ? "İptal" : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
