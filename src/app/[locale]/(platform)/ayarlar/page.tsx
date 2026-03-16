"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  Globe,
  MapPin,
  Music,
  FileText,
  Save,
  Loader2,
  LogOut,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tProfile = useTranslations("profile");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { data: session, update } = useSession();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [form, setForm] = useState({
    name: "",
    surname: "",
    username: "",
    city: "",
    country: "",
    gender: "",
    danceStyle: "",
    bio: "",
    language: "tr",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        setForm({
          name: data.name || "",
          surname: data.surname || "",
          username: data.username || "",
          city: data.city || "",
          country: data.country || "",
          gender: data.gender || "",
          danceStyle: data.danceStyle || "",
          bio: data.bio || "",
          language: data.language || "tr",
        });
      }
    } catch {
      // ignore
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setError("");
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || tCommon("error"));
      } else {
        // Update session
        await update({
          user: {
            ...session?.user,
            name: form.name,
            surname: form.surname,
            username: form.username,
            language: form.language,
          },
        });

        setSaved(true);

        // If language changed, redirect
        if (form.language !== locale) {
          const currentPath = window.location.pathname;
          const newPath = currentPath.replace(`/${locale}/`, `/${form.language}/`);
          router.push(newPath);
        }
      }
    } catch {
      setError(tCommon("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: `/${locale}/giris` });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold text-ml-white">{t("title")}</h1>

      {error && (
        <div className="p-3 rounded-lg bg-ml-red/10 border border-ml-red/30 text-ml-red-light text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="p-3 rounded-lg bg-ml-success/10 border border-ml-success/30 text-ml-success text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          {t("saved")}
        </div>
      )}

      {/* Profile Settings */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-ml-white flex items-center gap-2">
          <User className="w-4 h-4 text-ml-red" />
          {t("profileSettings")}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ml-gray-400 mb-1">
              {tAuth("name")}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-ml-gray-400 mb-1">
              {tAuth("surname")}
            </label>
            <input
              type="text"
              value={form.surname}
              onChange={(e) => updateField("surname", e.target.value)}
              className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ml-gray-400 mb-1">
            {tAuth("username")}
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => updateField("username", e.target.value)}
            className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ml-gray-400 mb-1">
              <MapPin className="w-3 h-3 inline mr-1" />
              {tProfile("city")}
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-ml-gray-400 mb-1">
              {tProfile("country")}
            </label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ml-gray-400 mb-1">
            {tProfile("gender")}
          </label>
          <select
            value={form.gender}
            onChange={(e) => updateField("gender", e.target.value)}
            className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none appearance-none"
          >
            <option value="">-</option>
            <option value="male">{tProfile("genders.male")}</option>
            <option value="female">{tProfile("genders.female")}</option>
            <option value="other">{tProfile("genders.other")}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-ml-gray-400 mb-1">
            <Music className="w-3 h-3 inline mr-1" />
            {tProfile("danceStyle")}
          </label>
          <input
            type="text"
            value={form.danceStyle}
            onChange={(e) => updateField("danceStyle", e.target.value)}
            className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none"
            placeholder="Hip Hop, Breaking, Salsa..."
          />
        </div>

        <div>
          <label className="block text-xs text-ml-gray-400 mb-1">
            <FileText className="w-3 h-3 inline mr-1" />
            {tProfile("bio")}
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => updateField("bio", e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 bg-ml-dark border border-ml-dark-border rounded-lg text-ml-white text-sm focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none resize-none"
          />
        </div>
      </div>

      {/* Language Settings */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-ml-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-ml-red" />
          {t("languageSettings")}
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => updateField("language", "tr")}
            className={`p-3 rounded-xl border text-sm font-medium transition-all ${
              form.language === "tr"
                ? "border-ml-red bg-ml-red/10 text-ml-red"
                : "border-ml-dark-border bg-ml-dark text-ml-gray-400 hover:border-ml-gray-500"
            }`}
          >
            🇹🇷 {t("turkish")}
          </button>
          <button
            type="button"
            onClick={() => updateField("language", "en")}
            className={`p-3 rounded-xl border text-sm font-medium transition-all ${
              form.language === "en"
                ? "border-ml-red bg-ml-red/10 text-ml-red"
                : "border-ml-dark-border bg-ml-dark text-ml-gray-400 hover:border-ml-gray-500"
            }`}
          >
            🇬🇧 {t("english")}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full py-3 bg-ml-red hover:bg-ml-red-light text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-ml-red/20 hover:shadow-ml-red/40 active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Save className="w-4 h-4" />
            {tCommon("save")}
          </>
        )}
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 bg-ml-dark-card border border-ml-dark-border text-ml-gray-400 font-medium rounded-xl transition-all hover:border-ml-red/40 hover:text-ml-red active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        {useTranslations("nav")("logout")}
      </button>
    </div>
  );
}
