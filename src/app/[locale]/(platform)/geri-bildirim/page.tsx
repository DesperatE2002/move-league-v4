"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MessageSquarePlus,
  Star,
  Send,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Bug,
  Palette,
  Zap,
  Lightbulb,
  FileText,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "bug", icon: Bug, colorClass: "text-red-400" },
  { value: "ui_ux", icon: Palette, colorClass: "text-purple-400" },
  { value: "performance", icon: Zap, colorClass: "text-yellow-400" },
  { value: "feature", icon: Lightbulb, colorClass: "text-green-400" },
  { value: "content", icon: FileText, colorClass: "text-blue-400" },
  { value: "other", icon: HelpCircle, colorClass: "text-ml-gray-400" },
];

const CATEGORY_LABELS_TR: Record<string, string> = {
  bug: "Hata / Bug",
  ui_ux: "Tasarım / Kullanılabilirlik",
  performance: "Performans / Hız",
  feature: "Yeni Özellik Önerisi",
  content: "İçerik / Çeviri",
  other: "Diğer",
};
const CATEGORY_LABELS_EN: Record<string, string> = {
  bug: "Bug / Error",
  ui_ux: "Design / Usability",
  performance: "Performance / Speed",
  feature: "Feature Request",
  content: "Content / Translation",
  other: "Other",
};

function StarRating({
  value,
  onChange,
  label,
  required,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-ml-gray-300">
        {label} {required && <span className="text-ml-red">*</span>}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "w-6 h-6 transition-colors",
                star <= value
                  ? "text-ml-gold fill-ml-gold"
                  : "text-ml-gray-600"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const params = useParams();
  const { data: session } = useSession();
  const locale = params.locale as string;
  const isTr = locale === "tr";
  const categoryLabels = isTr ? CATEGORY_LABELS_TR : CATEGORY_LABELS_EN;

  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [overallRating, setOverallRating] = useState(0);
  const [easeOfUse, setEaseOfUse] = useState(0);
  const [battleSystemRating, setBattleSystemRating] = useState(0);
  const [workshopRating, setWorkshopRating] = useState(0);
  const [designRating, setDesignRating] = useState(0);
  const [mostLikedFeature, setMostLikedFeature] = useState("");
  const [mostDislikedFeature, setMostDislikedFeature] = useState("");
  const [missingFeature, setMissingFeature] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!category || !title.trim() || !description.trim() || !overallRating || !easeOfUse) {
      setError(isTr ? "Zorunlu alanları doldurunuz" : "Please fill required fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: title.trim(),
          description: description.trim(),
          overallRating,
          easeOfUse,
          battleSystemRating: battleSystemRating || null,
          workshopRating: workshopRating || null,
          designRating: designRating || null,
          mostLikedFeature: mostLikedFeature.trim() || null,
          mostDislikedFeature: mostDislikedFeature.trim() || null,
          missingFeature: missingFeature.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error");
        return;
      }

      setSubmitted(true);
    } catch {
      setError(isTr ? "Bağlantı hatası" : "Connection error");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <CheckCircle2 className="w-16 h-16 text-ml-success mb-4" />
        <h2 className="text-xl font-bold text-ml-white mb-2">
          {isTr ? "Geri Bildirim Gönderildi!" : "Feedback Submitted!"}
        </h2>
        <p className="text-sm text-ml-gray-400 text-center max-w-xs">
          {isTr
            ? "Değerli geri bildiriminiz için teşekkür ederiz. Platformu geliştirmemize yardımcı oluyorsunuz."
            : "Thank you for your valuable feedback. You're helping us improve the platform."}
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setCategory("");
            setTitle("");
            setDescription("");
            setOverallRating(0);
            setEaseOfUse(0);
            setBattleSystemRating(0);
            setWorkshopRating(0);
            setDesignRating(0);
            setMostLikedFeature("");
            setMostDislikedFeature("");
            setMissingFeature("");
          }}
          className="mt-6 px-4 py-2 bg-ml-red text-white text-sm font-medium rounded-lg hover:bg-ml-red/80 transition-all"
        >
          {isTr ? "Yeni Geri Bildirim Gönder" : "Send Another Feedback"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="w-5 h-5 text-ml-red" />
        <h1 className="text-xl font-bold text-ml-white">
          {isTr ? "Geri Bildirim" : "Feedback"}
        </h1>
      </div>

      <p className="text-xs text-ml-gray-400">
        {isTr
          ? "1 aylık test sürecinde gözlemlerinizi bizimle paylaşın. Yanıtlarınız platformu iyileştirmemize doğrudan katkı sağlayacak."
          : "Share your observations during the 1-month test period. Your responses will directly help us improve the platform."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ml-gray-300">
            {isTr ? "Kategori" : "Category"} <span className="text-ml-red">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all",
                    category === cat.value
                      ? "bg-ml-red/10 border-ml-red/30 text-ml-white"
                      : "bg-ml-dark-card border-ml-dark-border text-ml-gray-400 hover:border-ml-gray-500"
                  )}
                >
                  <Icon className={cn("w-4 h-4", category === cat.value ? "text-ml-red" : cat.colorClass)} />
                  <span className="text-[10px] leading-tight">{categoryLabels[cat.value]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ml-gray-300">
            {isTr ? "Başlık" : "Title"} <span className="text-ml-red">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={300}
            placeholder={isTr ? "Kısa bir başlık yazın..." : "Write a short title..."}
            className="w-full bg-ml-dark-card border border-ml-dark-border rounded-lg px-3 py-2.5 text-sm text-ml-white placeholder:text-ml-gray-600 focus:outline-none focus:border-ml-red/50 transition-all"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ml-gray-300">
            {isTr ? "Detaylı Açıklama" : "Detailed Description"} <span className="text-ml-red">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            rows={4}
            placeholder={
              isTr
                ? "Ne oldu? Ne bekliyordunuz? Adım adım anlatın..."
                : "What happened? What did you expect? Describe step by step..."
            }
            className="w-full bg-ml-dark-card border border-ml-dark-border rounded-lg px-3 py-2.5 text-sm text-ml-white placeholder:text-ml-gray-600 focus:outline-none focus:border-ml-red/50 transition-all resize-none"
          />
        </div>

        {/* Required Ratings */}
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-4">
          <p className="text-xs font-semibold text-ml-white">
            {isTr ? "Puanlama" : "Ratings"}
          </p>
          <StarRating
            value={overallRating}
            onChange={setOverallRating}
            label={isTr ? "Genel Memnuniyet" : "Overall Satisfaction"}
            required
          />
          <StarRating
            value={easeOfUse}
            onChange={setEaseOfUse}
            label={isTr ? "Kullanım Kolaylığı" : "Ease of Use"}
            required
          />
        </div>

        {/* Optional Ratings */}
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-4">
          <p className="text-xs font-semibold text-ml-white">
            {isTr ? "Modül Puanlama (İsteğe Bağlı)" : "Module Ratings (Optional)"}
          </p>
          <StarRating
            value={battleSystemRating}
            onChange={setBattleSystemRating}
            label={isTr ? "Battle / Düello Sistemi" : "Battle System"}
          />
          <StarRating
            value={workshopRating}
            onChange={setWorkshopRating}
            label={isTr ? "Atölye Sistemi" : "Workshop System"}
          />
          <StarRating
            value={designRating}
            onChange={setDesignRating}
            label={isTr ? "Görsel Tasarım" : "Visual Design"}
          />
        </div>

        {/* Open-ended questions */}
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
          <p className="text-xs font-semibold text-ml-white">
            {isTr ? "Açık Uçlu Sorular (İsteğe Bağlı)" : "Open Questions (Optional)"}
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] text-ml-gray-400">
              {isTr ? "En çok beğendiğiniz özellik nedir?" : "What feature do you like the most?"}
            </label>
            <input
              type="text"
              value={mostLikedFeature}
              onChange={(e) => setMostLikedFeature(e.target.value)}
              maxLength={2000}
              className="w-full bg-ml-dark border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-600 focus:outline-none focus:border-ml-red/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-ml-gray-400">
              {isTr ? "En çok rahatsız eden şey nedir?" : "What bothers you the most?"}
            </label>
            <input
              type="text"
              value={mostDislikedFeature}
              onChange={(e) => setMostDislikedFeature(e.target.value)}
              maxLength={2000}
              className="w-full bg-ml-dark border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-600 focus:outline-none focus:border-ml-red/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-ml-gray-400">
              {isTr
                ? "Eksik olduğunu düşündüğünüz bir özellik var mı?"
                : "Is there a feature you think is missing?"}
            </label>
            <input
              type="text"
              value={missingFeature}
              onChange={(e) => setMissingFeature(e.target.value)}
              maxLength={2000}
              className="w-full bg-ml-dark border border-ml-dark-border rounded-lg px-3 py-2 text-sm text-ml-white placeholder:text-ml-gray-600 focus:outline-none focus:border-ml-red/50 transition-all"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-ml-red bg-ml-red/10 border border-ml-red/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-ml-red text-white font-semibold py-3 rounded-xl hover:bg-ml-red/80 disabled:opacity-50 transition-all"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isTr ? "Gönder" : "Submit"}
        </button>
      </form>
    </div>
  );
}
