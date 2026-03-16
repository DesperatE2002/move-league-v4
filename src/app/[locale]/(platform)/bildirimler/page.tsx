"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  Bell,
  Swords,
  CheckCircle,
  XCircle,
  Trophy,
  Loader2,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

const iconMap: Record<string, React.ReactNode> = {
  battle_request: <Swords className="w-4 h-4 text-ml-red" />,
  battle_accepted: <CheckCircle className="w-4 h-4 text-ml-success" />,
  battle_declined: <XCircle className="w-4 h-4 text-ml-gray-500" />,
  battle_scheduled: <Swords className="w-4 h-4 text-ml-info" />,
  battle_result: <Trophy className="w-4 h-4 text-ml-gold" />,
  judge_assigned: <Swords className="w-4 h-4 text-purple-400" />,
};

export default function NotificationsPage() {
  const t = useTranslations("nav");
  const tNotif = useTranslations("notif");
  const params = useParams();
  const locale = params.locale as string;

  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifs();
  }, []);

  async function fetchNotifs() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.notifications);
      }
    } catch {
      // fail
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // fail
    }
  }

  async function markRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      // fail
    }
  }

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ml-white">{t("notifications")}</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-ml-gray-400 hover:text-ml-red transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            {tNotif("markAllRead")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : notifs.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <div className="inline-flex p-4 rounded-full bg-ml-dark mb-4">
            <Bell className="w-8 h-8 text-ml-gray-500" />
          </div>
          <h2 className="text-lg font-semibold text-ml-white mb-2">
            {tNotif("noNotifs")}
          </h2>
          <p className="text-sm text-ml-gray-400">
            {tNotif("noNotifsDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const battleId = (n.data as any)?.battleId;
            const Wrapper = battleId ? "a" : "div";
            const wrapperProps = battleId ? { href: `/${locale}/duellolar/${battleId}` } : {};
            return (
              <Wrapper
                key={n.id}
                {...wrapperProps}
                onClick={() => !n.isRead && markRead(n.id)}
                className={cn(
                  "block p-3 rounded-xl border transition-all",
                  n.isRead
                    ? "bg-ml-dark-card border-ml-dark-border"
                    : "bg-ml-dark-card/80 border-ml-red/20 cursor-pointer"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {iconMap[n.type] || <Bell className="w-4 h-4 text-ml-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        n.isRead ? "text-ml-gray-300" : "text-ml-white"
                      )}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <div className="w-2 h-2 rounded-full bg-ml-red shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-ml-gray-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-ml-gray-500 mt-1">
                      {new Date(n.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}
