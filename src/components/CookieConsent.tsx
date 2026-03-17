"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) || "tr";
  const isTr = locale === "tr";

  useEffect(() => {
    const consent = localStorage.getItem("ml_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem("ml_cookie_consent", "accepted");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 lg:pl-68 animate-fade-in">
      <div className="max-w-lg lg:max-w-2xl mx-auto bg-ml-dark-card border border-ml-dark-border rounded-2xl p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <Cookie className="w-5 h-5 text-ml-red flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-ml-gray-300 leading-relaxed">
              {isTr
                ? "Bu platform, oturum yönetimi ve dil tercihinizi hatırlamak için zorunlu çerezler kullanmaktadır. Reklam veya izleme çerezi kullanılmamaktadır."
                : "This platform uses essential cookies for session management and language preferences. No advertising or tracking cookies are used."}
            </p>
            <p className="text-xs text-ml-gray-500 mt-1">
              {isTr ? (
                <>Detaylar için <a href={`/${locale}/gizlilik`} className="text-ml-red underline hover:text-ml-red-light">Gizlilik Politikası</a>'nı inceleyebilirsiniz.</>
              ) : (
                <>See our <a href={`/${locale}/gizlilik`} className="text-ml-red underline hover:text-ml-red-light">Privacy Policy</a> for details.</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={accept}
              className="px-4 py-2 bg-ml-red text-white text-xs font-semibold rounded-lg hover:bg-ml-red-light transition-colors"
            >
              {isTr ? "Anladım" : "Got it"}
            </button>
            <button onClick={accept} className="p-1.5 text-ml-gray-500 hover:text-ml-gray-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
