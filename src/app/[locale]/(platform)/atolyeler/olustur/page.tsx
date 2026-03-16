"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GraduationCap, ArrowLeft, Loader2, Check, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import { DANCE_STYLES } from "@/lib/dance-styles";

export default function CreateWorkshopPage() {
  const t = useTranslations("workshops");
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const locale = params.locale as string;

  const isCoach = session?.user?.role === "coach" || session?.user?.role === "admin";

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "live" as "live" | "video",
    danceStyle: "",
    difficulty: "" as "" | "beginner" | "intermediate" | "advanced",
    price: 0,
    currency: "TRY" as "TRY" | "USD" | "EUR",
    videoUrl: "",
    maxParticipants: "",
    scheduledDate: "",
    durationMinutes: "",
    previewUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        title: form.title,
        type: form.type,
      };
      if (form.description) body.description = form.description;
      if (form.danceStyle) body.danceStyle = form.danceStyle;
      if (form.difficulty) body.difficulty = form.difficulty;
      if (form.price > 0) { body.price = form.price; body.currency = form.currency; }
      if (form.videoUrl) body.videoUrl = form.videoUrl;
      if (form.previewUrl) body.previewUrl = form.previewUrl;
      if (form.maxParticipants) body.maxParticipants = Number(form.maxParticipants);
      if (form.scheduledDate) body.scheduledDate = form.scheduledDate;
      if (form.durationMinutes) body.durationMinutes = Number(form.durationMinutes);

      const res = await fetch("/api/workshops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Bir hata oluştu");
      } else {
        setSuccess(true);
        setTimeout(() => router.push(`/${locale}/atolyeler`), 1500);
      }
    } catch {
      setError("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  if (!isCoach) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <ShieldX className="w-12 h-12 text-ml-gray-500 mb-4" />
        <p className="text-ml-gray-400 text-sm">{t("coachOnly")}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-ml-success/20 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-ml-success" />
        </div>
        <h2 className="text-lg font-bold text-ml-white mb-2">{t("created")}</h2>
        <p className="text-sm text-ml-gray-400">{t("createdDesc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <a href={`/${locale}/atolyeler`} className="inline-flex items-center gap-1 text-sm text-ml-gray-400 hover:text-ml-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {t("backToList")}
      </a>

      <div className="flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-ml-info" />
        <h1 className="text-xl font-bold text-ml-white">{t("createTitle")}</h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-ml-red/10 border border-ml-red/30 text-ml-red-light text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
          <div>
            <label className="block text-xs text-ml-gray-400 mb-1">{t("workshopTitle")}</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-info focus:ring-1 focus:ring-ml-info transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-ml-gray-400 mb-1">{t("description")}</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-info focus:ring-1 focus:ring-ml-info transition-all outline-none resize-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs text-ml-gray-400 mb-1">{t("type")}</label>
            <div className="flex gap-2">
              {(["live", "video"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateField("type", type)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all border",
                    form.type === type
                      ? "bg-ml-info/20 text-ml-info border-ml-info/40"
                      : "bg-ml-dark text-ml-gray-400 border-ml-dark-border hover:border-ml-info/30"
                  )}
                >
                  {t(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Dance Style */}
          <div>
            <label className="block text-xs text-ml-gray-400 mb-1">{t("danceStyle")}</label>
            <div className="flex flex-wrap gap-1.5">
              {DANCE_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateField("danceStyle", form.danceStyle === style ? "" : style)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                    form.danceStyle === style
                      ? "bg-ml-info/20 text-ml-info border-ml-info/40"
                      : "bg-ml-dark text-ml-gray-400 border-ml-dark-border hover:border-ml-info/30"
                  )}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs text-ml-gray-400 mb-1">{t("difficulty")}</label>
            <div className="flex gap-2">
              {(["beginner", "intermediate", "advanced"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => updateField("difficulty", form.difficulty === d ? "" : d)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-medium transition-all border",
                    form.difficulty === d
                      ? d === "beginner" ? "bg-ml-success/20 text-ml-success border-ml-success/40" :
                        d === "intermediate" ? "bg-ml-warning/20 text-ml-warning border-ml-warning/40" :
                        "bg-ml-red/20 text-ml-red border-ml-red/40"
                      : "bg-ml-dark text-ml-gray-400 border-ml-dark-border"
                  )}
                >
                  {t(d)}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ml-gray-400 mb-1">{t("price")}</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => updateField("price", Number(e.target.value))}
                className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-info focus:ring-1 focus:ring-ml-info transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-ml-gray-400 mb-1">{t("currency")}</label>
              <select
                value={form.currency}
                onChange={(e) => updateField("currency", e.target.value)}
                className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-info focus:ring-1 focus:ring-ml-info transition-all outline-none"
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Duration + Max Participants */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ml-gray-400 mb-1">{t("duration")}</label>
              <input
                type="number"
                min={5}
                value={form.durationMinutes}
                onChange={(e) => updateField("durationMinutes", e.target.value)}
                placeholder="60"
                className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-info focus:ring-1 focus:ring-ml-info transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-ml-gray-400 mb-1">{t("maxParticipants")}</label>
              <input
                type="number"
                min={1}
                value={form.maxParticipants}
                onChange={(e) => updateField("maxParticipants", e.target.value)}
                className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-info focus:ring-1 focus:ring-ml-info transition-all outline-none"
              />
            </div>
          </div>

          {form.type === "live" && (
            <div>
              <label className="block text-xs text-ml-gray-400 mb-1">{t("scheduledDate")}</label>
              <input
                type="datetime-local"
                value={form.scheduledDate}
                onChange={(e) => updateField("scheduledDate", e.target.value)}
                className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-info focus:ring-1 focus:ring-ml-info transition-all outline-none"
              />
            </div>
          )}

          {/* Preview URL — always shown */}
          <div>
            <label className="block text-xs text-ml-gray-400 mb-1">{t("previewUrl")}</label>
            <input
              type="url"
              value={form.previewUrl}
              onChange={(e) => updateField("previewUrl", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-info focus:ring-1 focus:ring-ml-info transition-all outline-none"
            />
            <p className="text-[10px] text-ml-gray-500 mt-1">{t("previewUrlHint")}</p>
          </div>

          {form.type === "video" && (
            <div>
              <label className="block text-xs text-ml-gray-400 mb-1">{t("videoUrl")}</label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => updateField("videoUrl", e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-info focus:ring-1 focus:ring-ml-info transition-all outline-none"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !form.title}
          className="w-full py-3 bg-ml-info hover:bg-ml-info/80 text-white font-semibold rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t("createBtn")}
        </button>
      </form>
    </div>
  );
}
