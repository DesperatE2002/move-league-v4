"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Download, X, Wifi, Bell, Zap, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) || "tr";
  const isTr = locale === "tr";

  useEffect(() => {
    const dismissed = localStorage.getItem("ml_pwa_dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Delay showing so user is settled in
      setTimeout(() => setShow(true), 3000);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem("ml_pwa_dismissed", String(Date.now()));
    setShow(false);
  }

  if (!show) return null;

  const features = isTr
    ? [
        { icon: Zap, text: "Hızlı erişim — ana ekranınızdan tek dokunuşla açılır" },
        { icon: Wifi, text: "Çevrimdışı destek — internet bağlantısı olmadan da kullanım" },
        { icon: Bell, text: "Anlık bildirimler — düello davetleri, sonuçlar ve duyurular" },
        { icon: Smartphone, text: "Tam ekran deneyim — tarayıcı çubuğu olmadan uygulama görünümü" },
      ]
    : [
        { icon: Zap, text: "Quick access — opens from your home screen with one tap" },
        { icon: Wifi, text: "Offline support — use the app without internet" },
        { icon: Bell, text: "Instant notifications — battle invites, results, and announcements" },
        { icon: Smartphone, text: "Full-screen experience — native app look without browser bars" },
      ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-sm bg-ml-dark rounded-2xl border border-ml-dark-border shadow-2xl shadow-ml-red/10 overflow-hidden">
        {/* Header with logo */}
        <div className="relative bg-gradient-to-b from-ml-red/20 to-transparent p-6 text-center">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 text-ml-gray-500 hover:text-ml-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src="/logo.png"
            alt="Move League"
            width={80}
            height={80}
            className="mx-auto rounded-xl shadow-lg shadow-ml-red/20"
          />
          <h2 className="text-lg font-bold text-ml-white mt-4">
            {isTr ? "Move League'i Yükle" : "Install Move League"}
          </h2>
          <p className="text-xs text-ml-gray-400 mt-1">
            {isTr
              ? "Uygulamayı ana ekranınıza ekleyin"
              : "Add the app to your home screen"}
          </p>
        </div>

        {/* Features */}
        <div className="px-5 pb-4 space-y-3">
          <p className="text-xs text-ml-gray-500 font-medium uppercase tracking-wider">
            {isTr ? "Uygulamayı yükleyerek:" : "By installing you get:"}
          </p>
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <f.icon className="w-4 h-4 text-ml-red flex-shrink-0 mt-0.5" />
              <span className="text-xs text-ml-gray-300 leading-relaxed">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Data note */}
        <div className="px-5 pb-4">
          <p className="text-[10px] text-ml-gray-500 leading-relaxed">
            {isTr
              ? "Uygulama yalnızca performans iyileştirme amacıyla statik dosyaları (resim, stil dosyaları) önbelleğe alır. Kişisel verileriniz cihazınızda depolanmaz. Detaylar için Gizlilik Politikamızı inceleyebilirsiniz."
              : "The app only caches static files (images, styles) for performance. Your personal data is not stored on your device. See our Privacy Policy for details."}
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-2 py-3 bg-ml-red hover:bg-ml-red-light text-white font-semibold rounded-xl transition-all shadow-lg shadow-ml-red/20 active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            {isTr ? "Uygulamayı Yükle" : "Install App"}
          </button>
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 text-sm text-ml-gray-400 hover:text-ml-white transition-colors"
          >
            {isTr ? "Şimdi değil" : "Not now"}
          </button>
        </div>
      </div>
    </div>
  );
}
