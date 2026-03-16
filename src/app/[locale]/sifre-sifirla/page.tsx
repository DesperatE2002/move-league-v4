"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { KeyRound, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

function PasswordResetContent() {
  const t = useTranslations("auth");
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Step 1: Request password reset (no token)
  async function handleRequestReset() {
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage(
          locale === "tr"
            ? "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."
            : "Password reset link has been sent to your email."
        );
      } else {
        setStatus("error");
        const data = await res.json();
        setMessage(data.error || (locale === "tr" ? "Bir hata oluştu" : "An error occurred"));
      }
    } catch {
      setStatus("error");
      setMessage(locale === "tr" ? "Bir hata oluştu" : "An error occurred");
    }
  }

  // Step 2: Reset password (with token)
  async function handleResetPassword() {
    if (!password || password !== confirmPassword) {
      setMessage(locale === "tr" ? "Şifreler eşleşmiyor" : "Passwords don't match");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage(
          locale === "tr" ? "Şifreniz başarıyla değiştirildi!" : "Your password has been changed!"
        );
      } else {
        setStatus("error");
        const data = await res.json();
        setMessage(data.error || (locale === "tr" ? "Bir hata oluştu" : "An error occurred"));
      }
    } catch {
      setStatus("error");
      setMessage(locale === "tr" ? "Bir hata oluştu" : "An error occurred");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ml-dark p-4">
      <div className="w-full max-w-md bg-ml-dark-card rounded-2xl border border-ml-dark-border p-6 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-ml-red/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-ml-red" />
          </div>
          <h1 className="text-xl font-bold text-ml-white">
            {locale === "tr" ? "Şifre Sıfırlama" : "Reset Password"}
          </h1>
        </div>

        {status === "success" ? (
          <div className="text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-ml-success mx-auto" />
            <p className="text-sm text-ml-success">{message}</p>
            {token && (
              <a
                href={`/${locale}/giris`}
                className="block w-full py-3 bg-ml-red text-white font-semibold rounded-xl hover:bg-ml-red-dark transition-colors"
              >
                {t("login")}
              </a>
            )}
          </div>
        ) : !token ? (
          <div className="space-y-4">
            <p className="text-sm text-ml-gray-400 text-center">
              {locale === "tr"
                ? "E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz."
                : "Enter your email address and we'll send you a password reset link."}
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email")}
              className="w-full px-4 py-3 bg-ml-dark border border-ml-dark-border rounded-xl text-ml-white placeholder-ml-gray-500 focus:outline-none focus:border-ml-red/50"
            />
            {status === "error" && (
              <div className="flex items-center gap-2 text-ml-error text-sm">
                <AlertCircle className="w-4 h-4" />
                {message}
              </div>
            )}
            <button
              onClick={handleRequestReset}
              disabled={status === "loading"}
              className="w-full py-3 bg-ml-red text-white font-semibold rounded-xl hover:bg-ml-red-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
              {locale === "tr" ? "Sıfırlama Bağlantısı Gönder" : "Send Reset Link"}
            </button>
            <a
              href={`/${locale}/giris`}
              className="block text-center text-sm text-ml-gray-400 hover:text-ml-red transition-colors"
            >
              {t("login")}
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={locale === "tr" ? "Yeni şifre" : "New password"}
              className="w-full px-4 py-3 bg-ml-dark border border-ml-dark-border rounded-xl text-ml-white placeholder-ml-gray-500 focus:outline-none focus:border-ml-red/50"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("confirmPassword")}
              className="w-full px-4 py-3 bg-ml-dark border border-ml-dark-border rounded-xl text-ml-white placeholder-ml-gray-500 focus:outline-none focus:border-ml-red/50"
            />
            {status === "error" && (
              <div className="flex items-center gap-2 text-ml-error text-sm">
                <AlertCircle className="w-4 h-4" />
                {message}
              </div>
            )}
            <button
              onClick={handleResetPassword}
              disabled={status === "loading"}
              className="w-full py-3 bg-ml-red text-white font-semibold rounded-xl hover:bg-ml-red-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
              {locale === "tr" ? "Şifreyi Değiştir" : "Change Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ml-dark">
          <Loader2 className="w-8 h-8 text-ml-red animate-spin" />
        </div>
      }
    >
      <PasswordResetContent />
    </Suspense>
  );
}
