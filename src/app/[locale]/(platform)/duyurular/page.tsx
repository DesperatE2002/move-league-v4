"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Megaphone, Loader2, FileText } from "lucide-react";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  isPublished: boolean;
  createdAt: string;
  authorName: string;
  authorSurname: string;
}

export default function AnnouncementsPage() {
  const t = useTranslations("nav");
  const params = useParams();
  const locale = params.locale as string;
  const isTr = locale === "tr";

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data.announcements);
        }
      } catch {
        // fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-ml-red" />
        <h1 className="text-xl font-bold text-ml-white">{t("announcements")}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <Megaphone className="w-8 h-8 text-ml-gray-500 mx-auto mb-3" />
          <p className="text-sm text-ml-gray-400">
            {isTr ? "Henüz duyuru yok" : "No announcements yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="bg-ml-dark-card rounded-xl border border-ml-dark-border overflow-hidden">
              {a.imageUrl && (
                <img src={a.imageUrl} alt={a.title} className="w-full max-h-56 object-cover" />
              )}
              <div className="p-4">
                <h3 className="text-base font-bold text-ml-white">{a.title}</h3>
                <p className="text-xs text-ml-gray-500 mt-0.5">
                  {a.authorName} {a.authorSurname} · {new Date(a.createdAt).toLocaleDateString(isTr ? "tr-TR" : "en-US", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-sm text-ml-gray-300 mt-3 whitespace-pre-wrap">{a.content}</p>

                {a.fileUrl && (
                  <a
                    href={a.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-2 rounded-lg bg-ml-dark-hover border border-ml-dark-border text-ml-info hover:border-ml-info/40 transition-all text-xs"
                  >
                    <FileText className="w-4 h-4" />
                    {a.fileName || (isTr ? "Dosya İndir" : "Download File")}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
