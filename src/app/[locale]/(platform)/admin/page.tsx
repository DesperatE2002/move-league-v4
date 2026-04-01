"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Shield,
  Users,
  Swords,
  Trophy,
  Calendar,
  Award,
  Loader2,
  ChevronRight,
  GraduationCap,
  Gavel,
  Medal,
  Megaphone,
  CalendarDays,
  MessageSquarePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  totalBattles: number;
  activeBattles: number;
  completedBattles: number;
  activeSeason: string | null;
}

export default function AdminPage() {
  const t = useTranslations("admin");
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const locale = params.locale as string;

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // fail
    } finally {
      setLoading(false);
    }
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 text-ml-gray-500 mx-auto mb-4" />
        <p className="text-ml-gray-400">{t("noAccess")}</p>
      </div>
    );
  }

  const menuItems = [
    {
      title: t("battleManagement"),
      desc: t("battleManagementDesc"),
      icon: <Swords className="w-5 h-5" />,
      href: `/${locale}/admin/duellolar`,
      color: "text-ml-red",
    },
    {
      title: t("seasonManagement"),
      desc: t("seasonManagementDesc"),
      icon: <Calendar className="w-5 h-5" />,
      href: `/${locale}/admin/sezonlar`,
      color: "text-ml-gold",
    },
    {
      title: t("badgeManagement"),
      desc: t("badgeManagementDesc"),
      icon: <Award className="w-5 h-5" />,
      href: `/${locale}/admin/rozetler`,
      color: "text-purple-400",
    },
    {
      title: t("userManagement"),
      desc: t("userManagementDesc"),
      icon: <Users className="w-5 h-5" />,
      href: `/${locale}/admin/kullanicilar`,
      color: "text-ml-info",
    },
    {
      title: t("workshopManagement"),
      desc: t("workshopManagementDesc"),
      icon: <GraduationCap className="w-5 h-5" />,
      href: `/${locale}/admin/atolyeler`,
      color: "text-emerald-400",
    },
    {
      title: t("judgeManagement"),
      desc: t("judgeManagementDesc"),
      icon: <Gavel className="w-5 h-5" />,
      href: `/${locale}/admin/hakemler`,
      color: "text-orange-400",
    },
    {
      title: t("competitionManagement"),
      desc: t("competitionManagementDesc"),
      icon: <Medal className="w-5 h-5" />,
      href: `/${locale}/admin/yarisma`,
      color: "text-pink-400",
    },
    {
      title: t("announcementManagement"),
      desc: t("announcementManagementDesc"),
      icon: <Megaphone className="w-5 h-5" />,
      href: `/${locale}/admin/duyurular`,
      color: "text-amber-400",
    },
    {
      title: t("weeklySchedule"),
      desc: t("weeklyScheduleDesc"),
      icon: <CalendarDays className="w-5 h-5" />,
      href: `/${locale}/admin/program`,
      color: "text-cyan-400",
    },
    {
      title: t("feedbackManagement"),
      desc: t("feedbackManagementDesc"),
      icon: <MessageSquarePlus className="w-5 h-5" />,
      href: `/${locale}/admin/geri-bildirimler`,
      color: "text-teal-400",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-ml-red" />
        <h1 className="text-xl font-bold text-ml-white">{t("title")}</h1>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4">
            <Users className="w-5 h-5 text-ml-info mb-2" />
            <p className="text-2xl font-bold text-ml-white">{stats.totalUsers}</p>
            <p className="text-xs text-ml-gray-500">{t("totalUsers")}</p>
          </div>
          <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4">
            <Swords className="w-5 h-5 text-ml-red mb-2" />
            <p className="text-2xl font-bold text-ml-white">{stats.totalBattles}</p>
            <p className="text-xs text-ml-gray-500">{t("totalBattles")}</p>
          </div>
          <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4">
            <Trophy className="w-5 h-5 text-ml-success mb-2" />
            <p className="text-2xl font-bold text-ml-white">{stats.completedBattles}</p>
            <p className="text-xs text-ml-gray-500">{t("completedBattles")}</p>
          </div>
          <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4">
            <Calendar className="w-5 h-5 text-ml-gold mb-2" />
            <p className="text-sm font-bold text-ml-white truncate">{stats.activeSeason || "-"}</p>
            <p className="text-xs text-ml-gray-500">{t("activeSeason")}</p>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="space-y-2">
        {menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 p-4 bg-ml-dark-card rounded-xl border border-ml-dark-border hover:border-ml-red/30 transition-all"
          >
            <div className={cn("p-2 rounded-lg bg-ml-dark-hover", item.color)}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ml-white">{item.title}</p>
              <p className="text-xs text-ml-gray-400">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-ml-gray-500" />
          </a>
        ))}
      </div>
    </div>
  );
}
