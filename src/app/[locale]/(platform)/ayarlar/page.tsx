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
  ShieldCheck,
  Download,
  Trash2,
  Mail,
  AlertTriangle,
  PauseCircle,
  Camera,
  X,
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [showDeletion, setShowDeletion] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [activeLoading, setActiveLoading] = useState(false);
  const isTr = locale === "tr";

  useEffect(() => {
    fetchProfile();
    fetchConsent();
  }, []);

  const fetchConsent = async () => {
    try {
      const res = await fetch("/api/users/me/consents");
      if (res.ok) {
        const data = await res.json();
        setMarketingConsent(data.current?.marketingConsent || false);
      }
      const delRes = await fetch("/api/users/me/deletion-request");
      if (delRes.ok) {
        const delData = await delRes.json();
        setDeletionRequested(delData.requests?.some((r: any) => r.status === "pending") || false);
      }
    } catch { }
  };

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
        setIsActive(data.isActive !== false);
        setAvatarUrl(data.avatarUrl || null);
      }
    } catch {
      // ignore
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(isTr ? "Sadece resim dosyası yükleyebilirsiniz" : "Only image files are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(isTr ? "Dosya boyutu en fazla 2MB olabilir" : "File size must be less than 2MB");
      return;
    }

    setAvatarUploading(true);
    setError("");

    try {
      const canvas = document.createElement("canvas");
      const img = new Image();
      const reader = new FileReader();

      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d")!;
          const min = Math.min(img.width, img.height);
          const sx = (img.width - min) / 2;
          const sy = (img.height - min) / 2;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
          resolve();
        };
        img.onerror = reject;
        img.src = dataUrl;
      });

      const compressed = canvas.toDataURL("image/webp", 0.8);

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: compressed }),
      });

      if (res.ok) {
        setAvatarUrl(compressed);
        setSaved(true);
      } else {
        const data = await res.json();
        setError(data.error || (isTr ? "Fotoğraf yüklenemedi" : "Failed to upload photo"));
      }
    } catch {
      setError(isTr ? "Fotoğraf yüklenemedi" : "Failed to upload photo");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
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

        {/* Avatar Upload */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-ml-dark border-2 border-ml-dark-border flex items-center justify-center overflow-hidden">
              {avatarUploading ? (
                <Loader2 className="w-5 h-5 text-ml-red animate-spin" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-ml-red">
                  {form.name?.[0] || "?"}{form.surname?.[0] || ""}
                </span>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-ml-red flex items-center justify-center cursor-pointer hover:bg-ml-red-light transition-colors shadow-lg">
              <Camera className="w-3.5 h-3.5 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-ml-white">
              {isTr ? "Profil Fotoğrafı" : "Profile Photo"}
            </p>
            <p className="text-[10px] text-ml-gray-500">
              {isTr ? "JPG, PNG veya WebP. Maks 2MB." : "JPG, PNG or WebP. Max 2MB."}
            </p>
            {avatarUrl && (
              <button
                onClick={async () => {
                  const res = await fetch("/api/users/me", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ avatarUrl: null }),
                  });
                  if (res.ok) setAvatarUrl(null);
                }}
                className="text-[10px] text-ml-red hover:underline mt-0.5 flex items-center gap-0.5"
              >
                <X className="w-3 h-3" />
                {isTr ? "Fotoğrafı Kaldır" : "Remove Photo"}
              </button>
            )}
          </div>
        </div>

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

      {/* Vacation / Passive Mode */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-ml-white flex items-center gap-2">
          <PauseCircle className="w-4 h-4 text-ml-red" />
          {isTr ? "Tatil / Pasif Modu" : "Vacation / Passive Mode"}
        </h2>

        <div className="flex items-center justify-between p-3 bg-ml-dark rounded-lg border border-ml-dark-border">
          <div className="flex items-center gap-2">
            <PauseCircle className={`w-4 h-4 ${isActive ? "text-ml-gray-400" : "text-ml-red"}`} />
            <div>
              <p className="text-xs font-medium text-ml-white">
                {isActive
                  ? (isTr ? "Aktif — Düellolara açık" : "Active — Open to battles")
                  : (isTr ? "Pasif — Düellolara kapalı" : "Passive — Not available for battles")}
              </p>
              <p className="text-[10px] text-ml-gray-500">
                {isTr
                  ? "Pasif moddayken kimse size düello atamaz ve siz de atamazsınız. Profilinizde pasif görünür."
                  : "In passive mode, no one can challenge you and you can't challenge others. Your profile shows passive."}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              setActiveLoading(true);
              try {
                const res = await fetch("/api/users/me", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ isActive: !isActive }),
                });
                if (res.ok) setIsActive(!isActive);
              } catch { } finally { setActiveLoading(false); }
            }}
            disabled={activeLoading}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isActive ? "bg-ml-success" : "bg-ml-red"
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              isActive ? "translate-x-5" : ""
            }`} />
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

      {/* KVKK & Privacy Rights */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-ml-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-ml-red" />
          {isTr ? "Gizlilik & KVKK Hakları" : "Privacy & KVKK Rights"}
        </h2>

        {/* Marketing consent toggle */}
        <div className="flex items-center justify-between p-3 bg-ml-dark rounded-lg border border-ml-dark-border">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-ml-gray-400" />
            <div>
              <p className="text-xs font-medium text-ml-white">
                {isTr ? "Pazarlama E-postaları" : "Marketing Emails"}
              </p>
              <p className="text-[10px] text-ml-gray-500">
                {isTr ? "Etkinlik, kampanya ve yenilik bildirimleri" : "Events, campaigns and update notifications"}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              setConsentLoading(true);
              try {
                const res = await fetch("/api/users/me/consents", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ marketingConsent: !marketingConsent }),
                });
                if (res.ok) setMarketingConsent(!marketingConsent);
              } catch { } finally { setConsentLoading(false); }
            }}
            disabled={consentLoading}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              marketingConsent ? "bg-ml-success" : "bg-ml-gray-700"
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              marketingConsent ? "translate-x-5" : ""
            }`} />
          </button>
        </div>

        {/* Data export */}
        <a
          href="/api/users/me/data-export"
          className="flex items-center gap-2 p-3 bg-ml-dark rounded-lg border border-ml-dark-border hover:border-ml-info/40 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-ml-info" />
          <div>
            <p className="text-xs font-medium text-ml-white">
              {isTr ? "Verilerimi İndir" : "Download My Data"}
            </p>
            <p className="text-[10px] text-ml-gray-500">
              {isTr ? "KVKK Madde 11 — Kişisel verilerinizin bir kopyasını JSON olarak indirin" : "KVKK Article 11 — Download a copy of your personal data as JSON"}
            </p>
          </div>
        </a>

        {/* Data deletion request */}
        <div className="p-3 bg-ml-dark rounded-lg border border-ml-dark-border space-y-2">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-ml-red" />
            <div>
              <p className="text-xs font-medium text-ml-white">
                {isTr ? "Hesap & Veri Silme Talebi" : "Account & Data Deletion Request"}
              </p>
              <p className="text-[10px] text-ml-gray-500">
                {isTr ? "KVKK Madde 7 — Kişisel verilerinizin silinmesini talep edin" : "KVKK Article 7 — Request deletion of your personal data"}
              </p>
            </div>
          </div>
          {deletionRequested ? (
            <div className="flex items-center gap-2 p-2 bg-ml-warning/10 border border-ml-warning/20 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-ml-warning" />
              <p className="text-[11px] text-ml-warning">
                {isTr ? "Silme talebiniz işleme alındı. 30 gün içinde sonuçlanacaktır." : "Your deletion request is being processed. It will be completed within 30 days."}
              </p>
            </div>
          ) : showDeletion ? (
            <div className="space-y-2">
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder={isTr ? "Silme sebebi (isteğe bağlı)" : "Reason for deletion (optional)"}
                rows={2}
                className="w-full px-3 py-2 bg-ml-dark-card border border-ml-dark-border rounded-lg text-ml-white text-xs placeholder:text-ml-gray-500 focus:outline-none focus:ring-1 focus:ring-ml-red resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/users/me/deletion-request", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reason: deletionReason }),
                      });
                      if (res.ok) { setDeletionRequested(true); setShowDeletion(false); }
                    } catch { }
                  }}
                  className="flex-1 py-2 bg-ml-red hover:bg-ml-red/80 text-white text-xs font-medium rounded-lg transition-all"
                >
                  {isTr ? "Silme Talebini Gönder" : "Submit Deletion Request"}
                </button>
                <button
                  onClick={() => setShowDeletion(false)}
                  className="px-4 py-2 bg-ml-dark-card border border-ml-dark-border text-ml-gray-400 text-xs rounded-lg hover:text-ml-white transition-all"
                >
                  {isTr ? "İptal" : "Cancel"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeletion(true)}
              className="w-full py-2 border border-ml-red/30 text-ml-red text-xs font-medium rounded-lg hover:bg-ml-red/10 transition-all"
            >
              {isTr ? "Veri Silme Talebinde Bulun" : "Request Data Deletion"}
            </button>
          )}
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap gap-2 pt-1">
          <a href={`/${locale}/kvkk`} className="text-[10px] text-ml-gray-500 hover:text-ml-info underline">
            {isTr ? "KVKK Aydınlatma Metni" : "KVKK Disclosure"}
          </a>
          <a href={`/${locale}/gizlilik`} className="text-[10px] text-ml-gray-500 hover:text-ml-info underline">
            {isTr ? "Gizlilik Politikası" : "Privacy Policy"}
          </a>
          <a href={`/${locale}/kullanim-kosullari`} className="text-[10px] text-ml-gray-500 hover:text-ml-info underline">
            {isTr ? "Kullanım Koşulları" : "Terms of Service"}
          </a>
        </div>
      </div>

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
