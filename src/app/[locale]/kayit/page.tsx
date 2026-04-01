"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AtSign,
  Loader2,
  ChevronDown,
  Music,
  CheckSquare,
  Square,
} from "lucide-react";
import { DANCE_STYLES } from "@/lib/dance-styles";
import { cn } from "@/lib/utils";

const ROLES = ["dancer", "coach", "studio", "judge"] as const;

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [form, setForm] = useState({
    name: "",
    surname: "",
    username: "",
    email: "",
    password: "",
    role: "dancer" as string,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [kvkkConsent, setKvkkConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signIn("google", {
        callbackUrl: `/${locale}/anasayfa`,
      });
    } catch {
      setError(tCommon("error"));
      setGoogleLoading(false);
    }
  };

  function toggleStyle(style: string) {
    setSelectedStyles((prev) =>
      prev.includes(style)
        ? prev.filter((s) => s !== style)
        : prev.length >= 5 ? prev : [...prev, style]
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          danceStyles: selectedStyles.length > 0 ? selectedStyles : undefined,
          kvkkConsent,
          termsConsent,
          marketingConsent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("registerError"));
      } else {
        setSuccess(t("registerSuccess"));
        setTimeout(() => router.push(`/${locale}/giris`), 2000);
      }
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

      {/* Register Form */}
      <div className="w-full max-w-sm animate-fade-in">
        <div className="bg-ml-dark rounded-2xl border border-ml-dark-border p-6 shadow-2xl shadow-ml-red/5">
          <h1 className="text-2xl font-bold text-center text-ml-white mb-6">
            {t("register")}
          </h1>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98] mb-4"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t("googleSignUp")}
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-ml-dark-border" />
            <span className="text-xs text-ml-gray-500">{t("or")}</span>
            <div className="flex-1 h-px bg-ml-dark-border" />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-ml-red/10 border border-ml-red/30 text-ml-red-light text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-ml-success/10 border border-ml-success/30 text-ml-success text-sm text-center">
              {success}
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

            {/* Email */}
            <div>
              <label className="block text-sm text-ml-gray-400 mb-1">
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ml-gray-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-ml-dark-card border border-ml-dark-border rounded-xl text-ml-white placeholder:text-ml-gray-500 focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none text-sm"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-ml-gray-400 mb-1">
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ml-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-2.5 bg-ml-dark-card border border-ml-dark-border rounded-xl text-ml-white placeholder:text-ml-gray-500 focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ml-gray-500 hover:text-ml-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-ml-gray-500 mt-1">
                Min 8 karakter, 1 büyük harf, 1 rakam
              </p>
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
            <div className="space-y-3 pt-2 border-t border-ml-dark-border">
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
                  <CheckSquare className="w-5 h-5 text-ml-red flex-shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-ml-gray-500 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-xs text-ml-gray-300 leading-relaxed">
                  {locale === "tr" ? (
                    <><a href={`/${locale}/kvkk`} target="_blank" className="text-ml-red underline hover:text-ml-red-light">KVKK Aydınlatma Metni</a>'ni okudum ve kişisel verilerimin belirtilen amaçlarla işlenmesini kabul ediyorum.</>
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
                  <CheckSquare className="w-5 h-5 text-ml-red flex-shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-ml-gray-500 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-xs text-ml-gray-300 leading-relaxed">
                  {locale === "tr" ? (
                    <><a href={`/${locale}/kullanim-kosullari`} target="_blank" className="text-ml-red underline hover:text-ml-red-light">Kullanım Koşulları</a>'nı ve <a href={`/${locale}/gizlilik`} target="_blank" className="text-ml-red underline hover:text-ml-red-light">Gizlilik Politikası</a>'nı okudum ve kabul ediyorum.</>
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
                  <CheckSquare className="w-5 h-5 text-ml-red flex-shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-ml-gray-500 flex-shrink-0 mt-0.5" />
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
              disabled={loading || !kvkkConsent || !termsConsent}
              className="w-full py-3 bg-ml-red hover:bg-ml-red-light text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-ml-red/20 hover:shadow-ml-red/40 active:scale-[0.98] mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                t("register")
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-5 text-center text-sm text-ml-gray-400">
            {t("hasAccount")}{" "}
            <a
              href={`/${locale}/giris`}
              className="text-ml-red hover:text-ml-red-light font-medium transition-colors"
            >
              {t("login")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
