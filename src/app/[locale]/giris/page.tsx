"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("loginError"));
      } else {
        router.push(`/${locale}/anasayfa`);
        router.refresh();
      }
    } catch {
      setError(tCommon("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ml-black px-4">
      {/* Logo */}
      <div className="mb-8 animate-fade-in">
        <img
          src="/logo.png"
          alt="Move League"
          width={180}
          height={180}
          className="mx-auto rounded-xl"
        />
      </div>

      {/* Login Form */}
      <div className="w-full max-w-sm animate-fade-in">
        <div className="bg-ml-dark rounded-2xl border border-ml-dark-border p-6 shadow-2xl shadow-ml-red/5">
          <h1 className="text-2xl font-bold text-center text-ml-white mb-6">
            {t("login")}
          </h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-ml-red/10 border border-ml-red/30 text-ml-red-light text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm text-ml-gray-400 mb-1.5">
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ml-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-ml-dark-card border border-ml-dark-border rounded-xl text-ml-white placeholder:text-ml-gray-500 focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-ml-gray-400 mb-1.5">
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ml-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-ml-dark-card border border-ml-dark-border rounded-xl text-ml-white placeholder:text-ml-gray-500 focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none"
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
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ml-red hover:bg-ml-red-light text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-ml-red/20 hover:shadow-ml-red/40 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                t("login")
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-ml-gray-400">
            {t("noAccount")}{" "}
            <a
              href={`/${locale}/kayit`}
              className="text-ml-red hover:text-ml-red-light font-medium transition-colors"
            >
              {t("register")}
            </a>
          </p>

          {/* Forgot password link */}
          <p className="mt-2 text-center">
            <a
              href={`/${locale}/sifre-sifirla`}
              className="text-sm text-ml-gray-500 hover:text-ml-red transition-colors"
            >
              {t("forgotPassword")}
            </a>
          </p>
        </div>

        {/* Legal links */}
        <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-ml-gray-600">
          <a href={`/${locale}/kvkk`} className="hover:text-ml-gray-400 transition-colors">KVKK</a>
          <span>·</span>
          <a href={`/${locale}/gizlilik`} className="hover:text-ml-gray-400 transition-colors">
            {locale === "tr" ? "Gizlilik" : "Privacy"}
          </a>
          <span>·</span>
          <a href={`/${locale}/kullanim-kosullari`} className="hover:text-ml-gray-400 transition-colors">
            {locale === "tr" ? "Koşullar" : "Terms"}
          </a>
        </div>
      </div>
    </div>
  );
}
