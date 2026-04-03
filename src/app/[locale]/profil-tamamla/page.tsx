"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  User,
  AtSign,
  Loader2,
  ChevronDown,
  Music,
  MapPin,
  CheckSquare,
  Square,
} from "lucide-react";
import { DANCE_STYLES } from "@/lib/dance-styles";
import { cn } from "@/lib/utils";

const ROLES = ["dancer", "coach", "studio", "judge"] as const;

export default function CompleteProfilePage() {
  const t = useTranslations("auth");
  const tProfile = useTranslations("profile");
  const tCommon = useTranslations("common");
  const { data: session, update } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [form, setForm] = useState({
    name: session?.user?.name || "",
    surname: session?.user?.surname === "-" ? "" : session?.user?.surname || "",
    username: session?.user?.username || "",
    role: "dancer",
    city: "",
    country: "Türkiye",
  });
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [kvkkConsent, setKvkkConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  function toggleStyle(style: string) {
    setSelectedStyles((prev) =>
      prev.includes(style)
        ? prev.filter((s) => s !== style)
        : prev.length >= 5
        ? prev
        : [...prev, style]
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.name || !form.surname || !form.username) {
      setError(locale === "tr" ? "Lütfen tüm alanları doldurun" : "Please fill in all fields");
      setLoading(false);
      return;
    }

    if (selectedStyles.length === 0) {
      setError(locale === "tr" ? "En az bir dans stili seçin" : "Select at least one dance style");
      setLoading(false);
      return;
    }

    if (!kvkkConsent || !termsConsent) {
      setError(locale === "tr" ? "KVKK ve Kullanım Koşullarını kabul etmeniz gerekiyor" : "You must accept KVKK and Terms of Service");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          surname: form.surname,
          username: form.username,
          role: form.role,
          city: form.city,
          country: form.country,
          danceStyle: selectedStyles.join(", "),
          kvkkConsent,
          termsConsent,
          marketingConsent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || tCommon("error"));
        setLoading(false);
        return;
      }

      // Update session with new data
      await update({
        user: {
          ...session?.user,
          name: form.name,
          surname: form.surname,
          username: form.username,
          profileCompleted: true,
        },
      });

      router.push(`/${locale}/anasayfa`);
      router.refresh();
    } catch {
      setError(tCommon("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ml-black px-4 py-8">
      {/* Logo */}
      <div className="mb-6 animate-fade-in">
        <img
          src="/logo.png"
          alt="Move League"
          width={140}
          height={140}
          className="mx-auto rounded-xl"
        />
      </div>

      <div className="w-full max-w-sm animate-fade-in">
        <div className="bg-ml-dark rounded-2xl border border-ml-dark-border p-6 shadow-2xl shadow-ml-red/5">
          <h1 className="text-2xl font-bold text-center text-ml-white mb-2">
            {t("completeProfile")}
          </h1>
          <p className="text-sm text-ml-gray-400 text-center mb-6">
            {t("completeProfileDesc")}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-ml-red/10 border border-ml-red/30 text-ml-red-light text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name & Surname */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-ml-gray-400 mb-1">
                  {t("name")}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ml-gray-500" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-ml-dark-card border border-ml-dark-border rounded-xl text-ml-white placeholder:text-ml-gray-500 focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none text-sm"
                    placeholder="Ad"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-ml-gray-400 mb-1">
                  {t("surname")}
                </label>
                <input
                  type="text"
                  value={form.surname}
                  onChange={(e) => updateField("surname", e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-ml-dark-card border border-ml-dark-border rounded-xl text-ml-white placeholder:text-ml-gray-500 focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none text-sm"
                  placeholder="Soyad"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm text-ml-gray-400 mb-1">
                {t("username")}
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ml-gray-500" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-ml-dark-card border border-ml-dark-border rounded-xl text-ml-white placeholder:text-ml-gray-500 focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none text-sm"
                  placeholder="kullanici_adi"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm text-ml-gray-400 mb-1">
                {t("selectRole")}
              </label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => updateField("role", e.target.value)}
                  className="w-full px-3 py-2.5 bg-ml-dark-card border border-ml-dark-border rounded-xl text-ml-white focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none text-sm appearance-none cursor-pointer"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {t(`roles.${role}`)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ml-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm text-ml-gray-400 mb-1">
                {tProfile("city")}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ml-gray-500" />
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-ml-dark-card border border-ml-dark-border rounded-xl text-ml-white placeholder:text-ml-gray-500 focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none text-sm"
                  placeholder={locale === "tr" ? "İstanbul" : "Istanbul"}
                />
              </div>
            </div>

            {/* Dance Styles */}
            <div>
              <label className="block text-sm text-ml-gray-400 mb-1.5 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                {t("selectDanceStyles")}
              </label>
              <div className="flex flex-wrap gap-2">
                {DANCE_STYLES.map((style) => {
                  const isSelected = selectedStyles.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        isSelected
                          ? "bg-ml-red/20 border-ml-red/40 text-ml-red"
                          : "bg-ml-dark-card border-ml-dark-border text-ml-gray-400 hover:border-ml-red/30"
                      )}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-ml-gray-500 mt-1">
                {selectedStyles.length}/5 {t("maxStyles")}
              </p>
            </div>

            {/* KVKK & Terms Consent */}
            <div className="space-y-3 pt-3 border-t border-ml-dark-border">
              <p className="text-xs text-ml-gray-400 font-medium">
                {locale === "tr" ? "Yasal Onaylar" : "Legal Consents"}
              </p>

              {/* KVKK */}
              <button
                type="button"
                onClick={() => setKvkkConsent(!kvkkConsent)}
                className="flex items-start gap-2.5 w-full text-left"
              >
                {kvkkConsent ? (
                  <CheckSquare className="w-5 h-5 text-ml-red shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-ml-gray-500 shrink-0 mt-0.5" />
                )}
                <span className="text-xs text-ml-gray-300 leading-relaxed">
                  {locale === "tr" ? (
                    <><a href={`/${locale}/kvkk`} target="_blank" className="text-ml-red underline hover:text-ml-red-light">KVKK Aydınlatma Metni</a>&apos;ni okudum ve kişisel verilerimin belirtilen amaçlarla işlenmesini kabul ediyorum.</>
                  ) : (
                    <>I have read the <a href={`/${locale}/kvkk`} target="_blank" className="text-ml-red underline hover:text-ml-red-light">KVKK Disclosure</a> and consent to the processing of my personal data.</>
                  )}
                </span>
              </button>

              {/* Terms */}
              <button
                type="button"
                onClick={() => setTermsConsent(!termsConsent)}
                className="flex items-start gap-2.5 w-full text-left"
              >
                {termsConsent ? (
                  <CheckSquare className="w-5 h-5 text-ml-red shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-ml-gray-500 shrink-0 mt-0.5" />
                )}
                <span className="text-xs text-ml-gray-300 leading-relaxed">
                  {locale === "tr" ? (
                    <><a href={`/${locale}/kullanim-kosullari`} target="_blank" className="text-ml-red underline hover:text-ml-red-light">Kullanım Koşulları</a>&apos;nı ve <a href={`/${locale}/gizlilik`} target="_blank" className="text-ml-red underline hover:text-ml-red-light">Gizlilik Politikası</a>&apos;nı okudum ve kabul ediyorum.</>
                  ) : (
                    <>I have read and accept the <a href={`/${locale}/kullanim-kosullari`} target="_blank" className="text-ml-red underline hover:text-ml-red-light">Terms of Service</a> and <a href={`/${locale}/gizlilik`} target="_blank" className="text-ml-red underline hover:text-ml-red-light">Privacy Policy</a>.</>
                  )}
                </span>
              </button>

              {/* Marketing (optional) */}
              <button
                type="button"
                onClick={() => setMarketingConsent(!marketingConsent)}
                className="flex items-start gap-2.5 w-full text-left"
              >
                {marketingConsent ? (
                  <CheckSquare className="w-5 h-5 text-ml-red shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-ml-gray-500 shrink-0 mt-0.5" />
                )}
                <span className="text-xs text-ml-gray-300 leading-relaxed">
                  {locale === "tr"
                    ? "Move League'den etkinlikler, yeni özellikler ve kampanyalar hakkında e-posta almak istiyorum. (İsteğe bağlı)"
                    : "I want to receive emails from Move League about events, new features, and promotions. (Optional)"}
                </span>
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ml-red hover:bg-ml-red-light text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-ml-red/20 hover:shadow-ml-red/40 active:scale-[0.98] mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                t("completeProfileBtn")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
