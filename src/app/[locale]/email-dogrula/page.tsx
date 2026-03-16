"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

function EmailVerifyContent() {
  const t = useTranslations("auth");
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    token ? "idle" : "idle"
  );
  const [message, setMessage] = useState("");

  async function handleVerify() {
    if (!token) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage(locale === "tr" ? "E-posta adresiniz doğrulandı!" : "Your email has been verified!");
      } else {
        setStatus("error");
        const data = await res.json();
        setMessage(data.error || (locale === "tr" ? "Doğrulama başarısız" : "Verification failed"));
      }
    } catch {
      setStatus("error");
      setMessage(locale === "tr" ? "Bir hata oluştu" : "An error occurred");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ml-dark p-4">
      <div className="w-full max-w-md bg-ml-dark-card rounded-2xl border border-ml-dark-border p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-ml-red/10 flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-ml-red" />
        </div>

        <h1 className="text-xl font-bold text-ml-white">
          {locale === "tr" ? "E-posta Doğrulama" : "Email Verification"}
        </h1>

        {!token ? (
          <div className="space-y-3">
            <p className="text-sm text-ml-gray-400">
              {locale === "tr"
                ? "Kayıt olduğunuzda gönderilen e-postadaki bağlantıya tıklayarak hesabınızı doğrulayın."
                : "Click the link in the email we sent you when you registered to verify your account."}
            </p>
          </div>
        ) : status === "idle" ? (
          <div className="space-y-4">
            <p className="text-sm text-ml-gray-400">
              {locale === "tr"
                ? "E-posta adresinizi doğrulamak için aşağıdaki butona tıklayın."
                : "Click the button below to verify your email address."}
            </p>
            <button
              onClick={handleVerify}
              className="w-full py-3 bg-ml-red text-white font-semibold rounded-xl hover:bg-ml-red-dark transition-colors"
            >
              {locale === "tr" ? "Doğrula" : "Verify"}
            </button>
          </div>
        ) : status === "loading" ? (
          <Loader2 className="w-8 h-8 text-ml-red animate-spin mx-auto" />
        ) : status === "success" ? (
          <div className="space-y-4">
            <CheckCircle className="w-12 h-12 text-ml-success mx-auto" />
            <p className="text-sm text-ml-success">{message}</p>
            <a
              href={`/${locale}/giris`}
              className="block w-full py-3 bg-ml-red text-white font-semibold rounded-xl hover:bg-ml-red-dark transition-colors"
            >
              {t("login")}
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <AlertCircle className="w-12 h-12 text-ml-error mx-auto" />
            <p className="text-sm text-ml-error">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmailVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ml-dark">
          <Loader2 className="w-8 h-8 text-ml-red animate-spin" />
        </div>
      }
    >
      <EmailVerifyContent />
    </Suspense>
  );
}
