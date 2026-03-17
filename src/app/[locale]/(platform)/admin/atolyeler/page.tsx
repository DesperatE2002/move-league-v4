"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { GraduationCap, Check, X, Loader2, ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminWorkshop {
  id: string;
  title: string;
  description: string | null;
  type: string;
  danceStyle: string | null;
  difficulty: string | null;
  isPublished: boolean;
  isApproved: boolean;
  deletionRequestedAt: string | null;
  createdAt: string;
  coach: { name: string; surname: string; username: string } | null;
}

export default function AdminWorkshopsPage() {
  const t = useTranslations("admin");
  const tW = useTranslations("workshops");
  const params = useParams();
  const locale = params.locale as string;

  const [workshops, setWorkshops] = useState<AdminWorkshop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkshops();
  }, []);

  async function fetchWorkshops() {
    try {
      const res = await fetch("/api/admin/workshops");
      if (res.ok) setWorkshops(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(workshopId: string, action: "approve" | "reject" | "approve_deletion" | "reject_deletion") {
    try {
      const res = await fetch("/api/admin/workshops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workshopId, action }),
      });
      if (res.ok) fetchWorkshops();
    } catch {
      // silent
    }
  }

  async function handleDelete(workshopId: string) {
    if (!confirm("Bu atölyeyi kalıcı olarak silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch("/api/admin/workshops", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workshopId }),
      });
      if (res.ok) fetchWorkshops();
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <a href={`/${locale}/admin`} className="inline-flex items-center gap-1 text-sm text-ml-gray-400 hover:text-ml-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {t("title")}
      </a>

      <div className="flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-ml-info" />
        <h1 className="text-xl font-bold text-ml-white">{t("workshopManagement")}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-info animate-spin" />
        </div>
      ) : workshops.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <p className="text-sm text-ml-gray-400">{t("noWorkshops")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workshops.map((w) => (
            <div key={w.id} className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-ml-white">{w.title}</h3>
                  <p className="text-xs text-ml-gray-400">
                    {w.coach ? `${w.coach.name} ${w.coach.surname} (@${w.coach.username})` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {w.deletionRequestedAt && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-ml-red/10 text-ml-red border border-ml-red/20 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Silme Talebi
                    </span>
                  )}
                  {w.isApproved ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-ml-success/10 text-ml-success border border-ml-success/20">{t("approved")}</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-ml-warning/10 text-ml-warning border border-ml-warning/20">{t("pendingApproval")}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-ml-gray-500 mb-3">
                {w.type === "live" ? tW("live") : tW("video")}
                {w.danceStyle && ` · ${w.danceStyle}`}
                {w.difficulty && ` · ${w.difficulty}`}
                {` · ${new Date(w.createdAt).toLocaleDateString("tr-TR")}`}
              </div>

              <div className="flex gap-2 flex-wrap">
                {!w.isApproved && !w.deletionRequestedAt && (
                  <>
                    <button
                      onClick={() => handleAction(w.id, "approve")}
                      className="flex items-center gap-1 px-3 py-1.5 bg-ml-success/10 text-ml-success text-xs font-medium rounded-lg hover:bg-ml-success/20 transition-all border border-ml-success/20"
                    >
                      <Check className="w-3 h-3" /> {t("approve")}
                    </button>
                    <button
                      onClick={() => handleAction(w.id, "reject")}
                      className="flex items-center gap-1 px-3 py-1.5 bg-ml-red/10 text-ml-red text-xs font-medium rounded-lg hover:bg-ml-red/20 transition-all border border-ml-red/20"
                    >
                      <X className="w-3 h-3" /> {t("reject")}
                    </button>
                  </>
                )}

                {w.deletionRequestedAt && (
                  <>
                    <button
                      onClick={() => handleAction(w.id, "approve_deletion")}
                      className="flex items-center gap-1 px-3 py-1.5 bg-ml-red/10 text-ml-red text-xs font-medium rounded-lg hover:bg-ml-red/20 transition-all border border-ml-red/20"
                    >
                      <Check className="w-3 h-3" /> Silmeyi Onayla
                    </button>
                    <button
                      onClick={() => handleAction(w.id, "reject_deletion")}
                      className="flex items-center gap-1 px-3 py-1.5 bg-ml-warning/10 text-ml-warning text-xs font-medium rounded-lg hover:bg-ml-warning/20 transition-all border border-ml-warning/20"
                    >
                      <X className="w-3 h-3" /> Talebi Reddet
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleDelete(w.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-ml-red/10 text-ml-red text-xs font-medium rounded-lg hover:bg-ml-red/20 transition-all border border-ml-red/20 ml-auto"
                >
                  <Trash2 className="w-3 h-3" /> Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
