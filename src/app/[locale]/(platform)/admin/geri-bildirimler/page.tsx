"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MessageSquarePlus,
  ArrowLeft,
  Loader2,
  Shield,
  Star,
  Bug,
  Palette,
  Zap,
  Lightbulb,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  StickyNote,
  User,
  Clock,
  Filter,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackItem {
  id: string;
  userId: string;
  category: string;
  title: string;
  description: string;
  overallRating: number;
  easeOfUse: number;
  battleSystemRating: number | null;
  workshopRating: number | null;
  designRating: number | null;
  mostLikedFeature: string | null;
  mostDislikedFeature: string | null;
  missingFeature: string | null;
  deviceInfo: string | null;
  browserInfo: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  userName: string;
  userSurname: string;
  userUsername: string;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  bug: Bug,
  ui_ux: Palette,
  performance: Zap,
  feature: Lightbulb,
  content: FileText,
  other: HelpCircle,
};
const CATEGORY_COLORS: Record<string, string> = {
  bug: "text-red-400 bg-red-400/10",
  ui_ux: "text-purple-400 bg-purple-400/10",
  performance: "text-yellow-400 bg-yellow-400/10",
  feature: "text-green-400 bg-green-400/10",
  content: "text-blue-400 bg-blue-400/10",
  other: "text-ml-gray-400 bg-ml-gray-400/10",
};
const CATEGORY_LABELS_TR: Record<string, string> = {
  bug: "Hata", ui_ux: "Tasarım", performance: "Performans",
  feature: "Özellik", content: "İçerik", other: "Diğer",
};
const CATEGORY_LABELS_EN: Record<string, string> = {
  bug: "Bug", ui_ux: "UI/UX", performance: "Performance",
  feature: "Feature", content: "Content", other: "Other",
};

const STATUS_LABELS_TR: Record<string, string> = {
  new: "Yeni", reviewed: "İncelendi", in_progress: "İşlemde",
  resolved: "Çözüldü", wont_fix: "Düzeltilmeyecek",
};
const STATUS_LABELS_EN: Record<string, string> = {
  new: "New", reviewed: "Reviewed", in_progress: "In Progress",
  resolved: "Resolved", wont_fix: "Won't Fix",
};
const STATUS_COLORS: Record<string, string> = {
  new: "bg-ml-info/20 text-ml-info",
  reviewed: "bg-ml-gold/20 text-ml-gold",
  in_progress: "bg-purple-400/20 text-purple-400",
  resolved: "bg-ml-success/20 text-ml-success",
  wont_fix: "bg-ml-gray-500/20 text-ml-gray-500",
};

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("w-3 h-3", s <= count ? "text-ml-gold fill-ml-gold" : "text-ml-gray-600")}
        />
      ))}
    </div>
  );
}

export default function AdminFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const locale = params.locale as string;
  const isTr = locale === "tr";

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [noteEditing, setNoteEditing] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const categoryLabels = isTr ? CATEGORY_LABELS_TR : CATEGORY_LABELS_EN;
  const statusLabels = isTr ? STATUS_LABELS_TR : STATUS_LABELS_EN;

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  async function fetchFeedbacks() {
    try {
      const res = await fetch("/api/feedbacks");
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/feedbacks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  async function saveNote(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/feedbacks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminNote: noteText }),
      });
      if (res.ok) {
        setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, adminNote: noteText } : f)));
        setNoteEditing(null);
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = feedbacks.filter((f) => {
    if (filterCategory !== "all" && f.category !== filterCategory) return false;
    if (filterStatus !== "all" && f.status !== filterStatus) return false;
    return true;
  });

  // Stats
  const avgOverall = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.overallRating, 0) / feedbacks.length).toFixed(1)
    : "—";
  const avgEase = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.easeOfUse, 0) / feedbacks.length).toFixed(1)
    : "—";
  const newCount = feedbacks.filter((f) => f.status === "new").length;

  if (session?.user?.role !== "admin") {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 text-ml-gray-500 mx-auto mb-4" />
        <p className="text-ml-gray-400">{isTr ? "Yetkisiz erişim" : "Unauthorized"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/${locale}/admin`)}
          className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-hover transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <MessageSquarePlus className="w-5 h-5 text-ml-red" />
        <h1 className="text-xl font-bold text-ml-white">
          {isTr ? "Geri Bildirimler" : "Feedbacks"}
        </h1>
        <span className="text-xs text-ml-gray-500 ml-auto">
          {feedbacks.length} {isTr ? "toplam" : "total"}
        </span>
      </div>

      {/* Stats */}
      {!loading && feedbacks.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-ml-dark-card rounded-lg border border-ml-dark-border p-3 text-center">
            <BarChart3 className="w-4 h-4 text-ml-gold mx-auto mb-1" />
            <p className="text-lg font-bold text-ml-white">{avgOverall}</p>
            <p className="text-[10px] text-ml-gray-500">{isTr ? "Ort. Memnuniyet" : "Avg. Satisfaction"}</p>
          </div>
          <div className="bg-ml-dark-card rounded-lg border border-ml-dark-border p-3 text-center">
            <Star className="w-4 h-4 text-ml-info mx-auto mb-1" />
            <p className="text-lg font-bold text-ml-white">{avgEase}</p>
            <p className="text-[10px] text-ml-gray-500">{isTr ? "Ort. Kullanım" : "Avg. Ease"}</p>
          </div>
          <div className="bg-ml-dark-card rounded-lg border border-ml-dark-border p-3 text-center">
            <MessageSquarePlus className="w-4 h-4 text-ml-red mx-auto mb-1" />
            <p className="text-lg font-bold text-ml-red">{newCount}</p>
            <p className="text-[10px] text-ml-gray-500">{isTr ? "Yeni" : "New"}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-ml-gray-400" />
          <span className="text-xs text-ml-gray-400 font-medium">
            {isTr ? "Filtrele" : "Filter"}
          </span>
        </div>
        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterCategory("all")}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded-full border transition-all",
              filterCategory === "all"
                ? "bg-ml-white text-ml-dark border-ml-white"
                : "text-ml-gray-400 border-ml-dark-border hover:border-ml-gray-500"
            )}
          >
            {isTr ? "Tümü" : "All"}
          </button>
          {Object.keys(CATEGORY_ICONS).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border transition-all",
                filterCategory === cat
                  ? CATEGORY_COLORS[cat] + " border-current font-semibold"
                  : "text-ml-gray-400 border-ml-dark-border hover:border-ml-gray-500"
              )}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterStatus("all")}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded-full border transition-all",
              filterStatus === "all"
                ? "bg-ml-white text-ml-dark border-ml-white"
                : "text-ml-gray-400 border-ml-dark-border hover:border-ml-gray-500"
            )}
          >
            {isTr ? "Tüm Durumlar" : "All Status"}
          </button>
          {Object.keys(STATUS_LABELS_TR).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border transition-all",
                filterStatus === st
                  ? STATUS_COLORS[st] + " border-current font-semibold"
                  : "text-ml-gray-400 border-ml-dark-border hover:border-ml-gray-500"
              )}
            >
              {statusLabels[st]}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquarePlus className="w-10 h-10 text-ml-gray-600 mx-auto mb-3" />
          <p className="text-sm text-ml-gray-500">
            {isTr ? "Henüz geri bildirim yok" : "No feedbacks yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((fb) => {
            const CatIcon = CATEGORY_ICONS[fb.category] || HelpCircle;
            const isExpanded = expandedId === fb.id;

            return (
              <div
                key={fb.id}
                className="bg-ml-dark-card rounded-xl border border-ml-dark-border overflow-hidden"
              >
                {/* Collapsed header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-ml-dark-hover transition-all"
                >
                  <div className={cn("p-1.5 rounded-lg", CATEGORY_COLORS[fb.category])}>
                    <CatIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ml-white truncate">{fb.title}</p>
                    <p className="text-[10px] text-ml-gray-500">
                      {fb.userName} {fb.userSurname} · @{fb.userUsername}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stars count={fb.overallRating} />
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_COLORS[fb.status])}>
                      {statusLabels[fb.status]}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-ml-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-ml-gray-500" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-ml-dark-border pt-3 space-y-3">
                    {/* Description */}
                    <div>
                      <p className="text-[10px] font-semibold text-ml-gray-500 mb-1 uppercase">
                        {isTr ? "Açıklama" : "Description"}
                      </p>
                      <p className="text-xs text-ml-gray-300 whitespace-pre-wrap">{fb.description}</p>
                    </div>

                    {/* Ratings grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-ml-gray-500">{isTr ? "Genel Memnuniyet" : "Overall"}</p>
                        <Stars count={fb.overallRating} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-ml-gray-500">{isTr ? "Kullanım Kolaylığı" : "Ease of Use"}</p>
                        <Stars count={fb.easeOfUse} />
                      </div>
                      {fb.battleSystemRating && (
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-ml-gray-500">{isTr ? "Battle Sistemi" : "Battle System"}</p>
                          <Stars count={fb.battleSystemRating} />
                        </div>
                      )}
                      {fb.workshopRating && (
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-ml-gray-500">{isTr ? "Atölye" : "Workshop"}</p>
                          <Stars count={fb.workshopRating} />
                        </div>
                      )}
                      {fb.designRating && (
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-ml-gray-500">{isTr ? "Tasarım" : "Design"}</p>
                          <Stars count={fb.designRating} />
                        </div>
                      )}
                    </div>

                    {/* Open-ended answers */}
                    {(fb.mostLikedFeature || fb.mostDislikedFeature || fb.missingFeature) && (
                      <div className="space-y-2">
                        {fb.mostLikedFeature && (
                          <div>
                            <p className="text-[10px] text-ml-success font-medium">
                              {isTr ? "En Beğenilen" : "Most Liked"}
                            </p>
                            <p className="text-xs text-ml-gray-300">{fb.mostLikedFeature}</p>
                          </div>
                        )}
                        {fb.mostDislikedFeature && (
                          <div>
                            <p className="text-[10px] text-ml-red font-medium">
                              {isTr ? "En Rahatsız Eden" : "Most Disliked"}
                            </p>
                            <p className="text-xs text-ml-gray-300">{fb.mostDislikedFeature}</p>
                          </div>
                        )}
                        {fb.missingFeature && (
                          <div>
                            <p className="text-[10px] text-ml-info font-medium">
                              {isTr ? "Eksik Özellik" : "Missing Feature"}
                            </p>
                            <p className="text-xs text-ml-gray-300">{fb.missingFeature}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Device / date */}
                    <div className="flex items-center gap-3 text-[10px] text-ml-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(fb.createdAt).toLocaleDateString(isTr ? "tr-TR" : "en-US", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                      {fb.deviceInfo && <span>📱 {fb.deviceInfo}</span>}
                    </div>

                    {/* Status change */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-ml-gray-500 mr-1">
                        {isTr ? "Durum:" : "Status:"}
                      </span>
                      {["new", "reviewed", "in_progress", "resolved", "wont_fix"].map((st) => (
                        <button
                          key={st}
                          onClick={() => updateStatus(fb.id, st)}
                          disabled={actionLoading === fb.id}
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full border transition-all",
                            fb.status === st
                              ? STATUS_COLORS[st] + " border-current font-bold"
                              : "text-ml-gray-500 border-ml-dark-border hover:border-ml-gray-500"
                          )}
                        >
                          {statusLabels[st]}
                        </button>
                      ))}
                    </div>

                    {/* Admin note */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-ml-gray-400 flex items-center gap-1">
                        <StickyNote className="w-3 h-3" />
                        {isTr ? "Admin Notu" : "Admin Note"}
                      </p>
                      {noteEditing === fb.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            maxLength={2000}
                            className="flex-1 bg-ml-dark border border-ml-dark-border rounded-lg px-2 py-1.5 text-xs text-ml-white focus:outline-none focus:border-ml-red/50"
                          />
                          <button
                            onClick={() => saveNote(fb.id)}
                            disabled={actionLoading === fb.id}
                            className="text-[10px] px-3 py-1.5 bg-ml-red text-white rounded-lg hover:bg-ml-red/80 disabled:opacity-50"
                          >
                            {isTr ? "Kaydet" : "Save"}
                          </button>
                          <button
                            onClick={() => setNoteEditing(null)}
                            className="text-[10px] px-3 py-1.5 text-ml-gray-400 border border-ml-dark-border rounded-lg hover:text-ml-white"
                          >
                            {isTr ? "İptal" : "Cancel"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setNoteEditing(fb.id);
                            setNoteText(fb.adminNote || "");
                          }}
                          className="text-xs text-ml-gray-400 hover:text-ml-white transition-all"
                        >
                          {fb.adminNote || (isTr ? "Not ekle..." : "Add note...")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
