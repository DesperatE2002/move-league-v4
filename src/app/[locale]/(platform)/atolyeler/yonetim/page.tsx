"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  GraduationCap,
  ArrowLeft,
  Loader2,
  Users,
  Star,
  Clock,
  TrendingUp,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShieldX,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnrolledUser {
  userId: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  city: string | null;
  country: string | null;
  danceStyle: string | null;
  enrolledAt: string;
  status: string;
}

interface CoachWorkshop {
  id: string;
  title: string;
  description: string | null;
  type: string;
  danceStyle: string | null;
  difficulty: string | null;
  price: string;
  currency: string;
  maxParticipants: number | null;
  scheduledDate: string | null;
  durationMinutes: number | null;
  isPublished: boolean;
  isApproved: boolean;
  deletionRequestedAt: string | null;
  createdAt: string;
  enrolledCount: number;
  avgRating: number | null;
  reviewCount: number;
  enrolledUsers: EnrolledUser[];
  isExpired: boolean;
}

interface Stats {
  total: number;
  active: number;
  expired: number;
  totalEnrolled: number;
  totalRevenue: number;
  avgRating: number | null;
}

const diffColors: Record<string, string> = {
  beginner: "bg-ml-success/10 text-ml-success border-ml-success/20",
  intermediate: "bg-ml-warning/10 text-ml-warning border-ml-warning/20",
  advanced: "bg-ml-red/10 text-ml-red border-ml-red/20",
};

export default function CoachWorkshopDashboard() {
  const t = useTranslations("workshops");
  const params = useParams();
  const { data: session } = useSession();
  const locale = params.locale as string;
  const isTr = locale === "tr";

  const [workshops, setWorkshops] = useState<CoachWorkshop[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "expired" | "all">("active");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/workshops/my");
      if (res.ok) {
        const data = await res.json();
        setWorkshops(data.workshops);
        setStats(data.stats);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestDeletion(workshopId: string) {
    if (!confirm(isTr ? "Bu atölyeyi kaldırmak istediğinize emin misiniz? Admin onayı gerekecektir." : "Are you sure you want to remove this workshop? Admin approval is required.")) return;
    setDeleting(workshopId);
    try {
      const res = await fetch(`/api/workshops/${workshopId}`, { method: "DELETE" });
      if (res.ok) await fetchData();
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  }

  if (session?.user?.role !== "coach" && session?.user?.role !== "admin") {
    return (
      <div className="text-center py-20">
        <ShieldX className="w-12 h-12 text-ml-gray-500 mx-auto mb-4" />
        <p className="text-ml-gray-400">{t("coachOnly")}</p>
      </div>
    );
  }

  const filtered = workshops.filter((w) => {
    if (tab === "active") return !w.isExpired && w.isApproved && w.isPublished;
    if (tab === "expired") return w.isExpired;
    return true;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a href={`/${locale}/atolyeler`} className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-card transition-all">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <GraduationCap className="w-5 h-5 text-ml-info" />
        <h1 className="text-xl font-bold text-ml-white">
          {isTr ? "Atölye Yönetimi" : "Workshop Management"}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-info animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={GraduationCap} label={isTr ? "Toplam Atölye" : "Total Workshops"} value={stats.total} color="text-ml-info" />
              <StatCard icon={Users} label={isTr ? "Toplam Kayıtlı" : "Total Enrolled"} value={stats.totalEnrolled} color="text-purple-400" />
              <StatCard icon={Star} label={isTr ? "Ort. Puan" : "Avg. Rating"} value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"} color="text-ml-gold" />
              <StatCard icon={TrendingUp} label={isTr ? "Tahmini Gelir" : "Est. Revenue"} value={`₺${stats.totalRevenue.toLocaleString()}`} color="text-ml-success" />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            {(["active", "expired", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-medium transition-all",
                  tab === t
                    ? "bg-ml-info text-white"
                    : "bg-ml-dark-card text-ml-gray-400 border border-ml-dark-border hover:border-ml-info/40"
                )}
              >
                {t === "active" ? (isTr ? "Aktif" : "Active") :
                 t === "expired" ? (isTr ? "Süresi Dolmuş" : "Expired") :
                 (isTr ? "Tümü" : "All")}
                {t === "active" && stats ? ` (${stats.active})` : ""}
                {t === "expired" && stats ? ` (${stats.expired})` : ""}
              </button>
            ))}
          </div>

          {/* Workshop List */}
          {filtered.length === 0 ? (
            <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
              <GraduationCap className="w-8 h-8 text-ml-gray-500 mx-auto mb-3" />
              <p className="text-sm text-ml-gray-400">
                {isTr ? "Bu kategoride atölye yok" : "No workshops in this category"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((w) => (
                <div key={w.id} className="bg-ml-dark-card rounded-xl border border-ml-dark-border overflow-hidden">
                  {/* Workshop Header */}
                  <button
                    onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                    className="w-full p-4 text-left hover:bg-ml-dark-hover/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-ml-white truncate">{w.title}</h3>
                          {w.isExpired && (
                            <span className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-ml-gray-800 text-ml-gray-400 border border-ml-dark-border">
                              <Clock className="w-3 h-3" />
                              {isTr ? "Sona Erdi" : "Expired"}
                            </span>
                          )}
                          {!w.isApproved && (
                            <span className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-ml-warning/10 text-ml-warning border border-ml-warning/20">
                              <AlertTriangle className="w-3 h-3" />
                              {isTr ? "Onay Bekleniyor" : "Pending"}
                            </span>
                          )}
                          {w.deletionRequestedAt && (
                            <span className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-ml-red/10 text-ml-red border border-ml-red/20">
                              <XCircle className="w-3 h-3" />
                              {isTr ? "Silme Onayı Bekleniyor" : "Deletion Pending"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-ml-gray-500">
                          {w.danceStyle && <span>{w.danceStyle}</span>}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {w.enrolledCount}{w.maxParticipants ? `/${w.maxParticipants}` : ""}
                          </span>
                          {w.avgRating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-ml-gold" /> {w.avgRating.toFixed(1)} ({w.reviewCount})
                            </span>
                          )}
                          <span>{Number(w.price) > 0 ? `${w.price} ${w.currency}` : (isTr ? "Ücretsiz" : "Free")}</span>
                        </div>
                      </div>
                      {expanded === w.id ? (
                        <ChevronUp className="w-5 h-5 text-ml-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-ml-gray-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Expanded: Enrolled Users */}
                  {expanded === w.id && (
                    <div className="border-t border-ml-dark-border p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-ml-gray-400 uppercase tracking-wider">
                        {isTr ? "Kayıtlı Öğrenciler" : "Enrolled Students"} ({w.enrolledUsers.length})
                      </h4>

                      {w.enrolledUsers.length === 0 ? (
                        <p className="text-xs text-ml-gray-500 py-3 text-center">
                          {isTr ? "Henüz kayıtlı öğrenci yok" : "No enrolled students yet"}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {w.enrolledUsers.map((u) => (
                            <div key={u.userId} className="flex items-center gap-3 p-3 bg-ml-dark rounded-lg border border-ml-dark-border">
                              <div className="w-9 h-9 rounded-full bg-ml-info/20 flex items-center justify-center text-ml-info font-bold text-xs flex-shrink-0">
                                {u.name[0]}{u.surname[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-ml-white truncate">
                                  {u.name} {u.surname}
                                </p>
                                <div className="flex items-center gap-2 text-[11px] text-ml-gray-500 flex-wrap">
                                  <span>@{u.username}</span>
                                  {u.danceStyle && <span>· {u.danceStyle}</span>}
                                  {u.city && (
                                    <span className="flex items-center gap-0.5">
                                      · <MapPin className="w-3 h-3" /> {u.city}{u.country ? `, ${u.country}` : ""}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-ml-gray-500">
                                  <a href={`mailto:${u.email}`} className="flex items-center gap-1 text-ml-info hover:underline">
                                    <Mail className="w-3 h-3" /> {u.email}
                                  </a>
                                  <span>· {new Date(u.enrolledAt).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US")}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Workshop quick stats */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-ml-dark-border">
                        <div className="text-center p-2 bg-ml-dark rounded-lg">
                          <p className="text-lg font-bold text-ml-white">{w.enrolledCount}</p>
                          <p className="text-[10px] text-ml-gray-500">{isTr ? "Kayıtlı" : "Enrolled"}</p>
                        </div>
                        <div className="text-center p-2 bg-ml-dark rounded-lg">
                          <p className="text-lg font-bold text-ml-white">{w.avgRating ? w.avgRating.toFixed(1) : "—"}</p>
                          <p className="text-[10px] text-ml-gray-500">{isTr ? "Puan" : "Rating"}</p>
                        </div>
                        <div className="text-center p-2 bg-ml-dark rounded-lg">
                          <p className="text-lg font-bold text-ml-white">
                            {Number(w.price) > 0 ? `₺${(w.enrolledCount * Number(w.price)).toLocaleString()}` : "—"}
                          </p>
                          <p className="text-[10px] text-ml-gray-500">{isTr ? "Gelir" : "Revenue"}</p>
                        </div>
                      </div>

                      {/* Link to workshop */}
                      <div className="flex items-center gap-3 mt-2">
                        <a
                          href={`/${locale}/atolyeler/${w.id}`}
                          className="text-xs text-ml-info hover:underline"
                        >
                          {isTr ? "Atölye sayfasına git →" : "Go to workshop page →"}
                        </a>
                        {!w.deletionRequestedAt && (
                          <button
                            onClick={() => handleRequestDeletion(w.id)}
                            disabled={deleting === w.id}
                            className="flex items-center gap-1 ml-auto px-3 py-1.5 bg-ml-red/10 text-ml-red text-xs font-medium rounded-lg hover:bg-ml-red/20 transition-all border border-ml-red/20 disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" />
                            {deleting === w.id
                              ? (isTr ? "Gönderiliyor..." : "Sending...")
                              : (isTr ? "Kaldırma Talebi" : "Request Removal")}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4">
      <Icon className={cn("w-5 h-5 mb-2", color)} />
      <p className="text-lg font-bold text-ml-white">{value}</p>
      <p className="text-[10px] text-ml-gray-500">{label}</p>
    </div>
  );
}
