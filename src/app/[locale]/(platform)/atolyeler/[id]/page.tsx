"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  GraduationCap,
  Star,
  Users,
  Clock,
  Calendar,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkshopDetail {
  id: string;
  coachId: string;
  title: string;
  description: string | null;
  type: string;
  danceStyle: string | null;
  difficulty: string | null;
  price: string;
  currency: string;
  videoUrl: string | null;
  maxParticipants: number | null;
  scheduledDate: string | null;
  durationMinutes: number | null;
  coach: { id: string; name: string; surname: string; username: string; avatarUrl: string | null } | null;
  enrolledCount: number;
  myEnrollment: { id: string; status: string } | null;
  avgRating: number | null;
  reviewCount: number;
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { name: string; surname: string; username: string } | null;
  }[];
}

const difficultyLabels: Record<string, string> = {
  beginner: "Başlangıç",
  intermediate: "Orta",
  advanced: "İleri",
};

export default function WorkshopDetailPage() {
  const t = useTranslations("workshops");
  const params = useParams();
  const locale = params.locale as string;
  const workshopId = params.id as string;

  const [workshop, setWorkshop] = useState<WorkshopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [workshopId]);

  async function fetchDetail() {
    try {
      const res = await fetch(`/api/workshops/${workshopId}`);
      if (res.ok) {
        setWorkshop(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/workshops/${workshopId}/enroll`, { method: "POST" });
      if (res.ok) fetchDetail();
    } catch {
      // silent
    } finally {
      setEnrolling(false);
    }
  }

  async function handleCancelEnroll() {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/workshops/${workshopId}/enroll`, { method: "DELETE" });
      if (res.ok) fetchDetail();
    } catch {
      // silent
    } finally {
      setEnrolling(false);
    }
  }

  async function handleReview() {
    setReviewing(true);
    try {
      const res = await fetch(`/api/workshops/${workshopId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment || undefined }),
      });
      if (res.ok) {
        setReviewComment("");
        fetchDetail();
      }
    } catch {
      // silent
    } finally {
      setReviewing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-ml-info animate-spin" />
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="text-center py-10">
        <p className="text-ml-gray-400">{t("notFound")}</p>
      </div>
    );
  }

  const isEnrolled = workshop.myEnrollment?.status === "enrolled";

  return (
    <div className="space-y-4 animate-fade-in">
      <a href={`/${locale}/atolyeler`} className="inline-flex items-center gap-1 text-sm text-ml-gray-400 hover:text-ml-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {t("backToList")}
      </a>

      {/* Header */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-5">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-xl font-bold text-ml-white">{workshop.title}</h1>
          {workshop.difficulty && (
            <span className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full border",
              workshop.difficulty === "beginner" ? "bg-ml-success/10 text-ml-success border-ml-success/20" :
              workshop.difficulty === "intermediate" ? "bg-ml-warning/10 text-ml-warning border-ml-warning/20" :
              "bg-ml-red/10 text-ml-red border-ml-red/20"
            )}>
              {difficultyLabels[workshop.difficulty] || workshop.difficulty}
            </span>
          )}
        </div>

        {workshop.description && (
          <p className="text-sm text-ml-gray-300 mb-4">{workshop.description}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-ml-gray-400">
          {workshop.danceStyle && (
            <span className="px-2 py-1 rounded-full bg-ml-info/10 text-ml-info border border-ml-info/20">
              {workshop.danceStyle}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {workshop.type === "live" ? t("live") : t("video")}
            {workshop.durationMinutes && ` · ${workshop.durationMinutes} dk`}
          </span>
          {workshop.scheduledDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(workshop.scheduledDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {workshop.enrolledCount}{workshop.maxParticipants ? `/${workshop.maxParticipants}` : ""} {t("enrolled")}
          </span>
          {workshop.avgRating && (
            <span className="flex items-center gap-1 text-ml-gold">
              <Star className="w-3 h-3 fill-ml-gold" />
              {workshop.avgRating.toFixed(1)} ({workshop.reviewCount})
            </span>
          )}
        </div>
      </div>

      {/* Coach */}
      {workshop.coach && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ml-info/20 flex items-center justify-center text-ml-info font-bold text-sm">
            {workshop.coach.avatarUrl ? (
              <img src={workshop.coach.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              workshop.coach.name[0]
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-ml-white">{workshop.coach.name} {workshop.coach.surname}</p>
            <p className="text-xs text-ml-gray-400">@{workshop.coach.username} · {t("coach")}</p>
          </div>
        </div>
      )}

      {/* Price + Enroll */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 flex items-center justify-between">
        <div>
          <span className="text-lg font-bold text-ml-info">
            {Number(workshop.price) > 0 ? `${workshop.price} ${workshop.currency}` : t("free")}
          </span>
        </div>
        {isEnrolled ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-ml-success flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> {t("enrolledStatus")}
            </span>
            <button
              onClick={handleCancelEnroll}
              disabled={enrolling}
              className="px-3 py-1.5 text-xs text-ml-gray-400 hover:text-ml-red border border-ml-dark-border rounded-lg transition-all"
            >
              {t("cancelEnroll")}
            </button>
          </div>
        ) : (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="px-4 py-2 bg-ml-info hover:bg-ml-info/80 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
          >
            {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : t("enroll")}
          </button>
        )}
      </div>

      {/* Reviews */}
      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4 space-y-3">
        <h3 className="text-sm font-semibold text-ml-white">{t("reviews")} ({workshop.reviewCount})</h3>

        {/* Add review */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setReviewRating(s)}>
                <Star className={cn("w-5 h-5", s <= reviewRating ? "text-ml-gold fill-ml-gold" : "text-ml-gray-500")} />
              </button>
            ))}
          </div>
          <input
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder={t("reviewPlaceholder")}
            className="flex-1 px-3 py-1.5 bg-ml-dark border border-ml-dark-border rounded-lg text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-1 focus:ring-ml-info"
          />
          <button
            onClick={handleReview}
            disabled={reviewing}
            className="p-2 bg-ml-info/20 text-ml-info rounded-lg hover:bg-ml-info/30 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Review list */}
        {workshop.reviews.length === 0 ? (
          <p className="text-xs text-ml-gray-500">{t("noReviews")}</p>
        ) : (
          <div className="space-y-2">
            {workshop.reviews.map((r) => (
              <div key={r.id} className="p-3 bg-ml-dark rounded-lg border border-ml-dark-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-ml-white">
                    {r.user ? `${r.user.name} ${r.user.surname}` : "Anonim"}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("w-3 h-3", s <= r.rating ? "text-ml-gold fill-ml-gold" : "text-ml-gray-500")} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-xs text-ml-gray-400">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
