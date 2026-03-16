"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Users, ArrowLeft, Loader2, Check } from "lucide-react";

export default function CreateTeamPage() {
  const t = useTranslations("teams");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [form, setForm] = useState({
    name: "",
    description: "",
    city: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, string> = { name: form.name };
      if (form.description) body.description = form.description;
      if (form.city) body.city = form.city;
      if (form.country) body.country = form.country;

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Bir hata oluştu");
      } else {
        setSuccess(true);
        setTimeout(() => router.push(`/${locale}/takimlar`), 1500);
      }
    } catch {
      setError("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-ml-success/20 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-ml-success" />
        </div>
        <h2 className="text-lg font-bold text-ml-white mb-2">{t("teamCreated")}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <a href={`/${locale}/takimlar`} className="inline-flex items-center gap-1 text-sm text-ml-gray-400 hover:text-ml-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {t("backToList")}
      </a>

      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-purple-400" />
        <h1 className="text-xl font-bold text-ml-white">{t("createTeamTitle")}</h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-ml-red/10 border border-ml-red/30 text-ml-red-light text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
          <div>
            <label className="block text-xs text-ml-gray-400 mb-1">{t("teamName")}</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-ml-gray-400 mb-1">{t("description")}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ml-gray-400 mb-1">{t("city")}</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-ml-gray-400 mb-1">{t("country")}</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !form.name}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t("createTeamBtn")}
        </button>
      </form>
    </div>
  );
}
