"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, usePathname } from "next/navigation";
import {
  Home,
  Swords,
  Trophy,
  Bell,
  User,
  Settings,
  Shield,
  LogOut,
  GraduationCap,
  Users,
  Medal,
  Megaphone,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface NavItem {
  key: string;
  href: string;
  icon: React.ReactNode;
}

export default function Sidebar({ role }: { role: string }) {
  const t = useTranslations("nav");
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUnread() {
    try {
      const res = await fetch("/api/notifications?countOnly=1");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // silent
    }
  }

  const navItems: NavItem[] = [
    { key: "home", href: `/${locale}/anasayfa`, icon: <Home className="w-5 h-5" /> },
    { key: "battles", href: `/${locale}/duellolar`, icon: <Swords className="w-5 h-5" /> },
    { key: "workshops", href: `/${locale}/atolyeler`, icon: <GraduationCap className="w-5 h-5" /> },
    { key: "teams", href: `/${locale}/takimlar`, icon: <Users className="w-5 h-5" /> },
    { key: "competitions", href: `/${locale}/yarisma`, icon: <Medal className="w-5 h-5" /> },
    { key: "rankings", href: `/${locale}/siralama`, icon: <Trophy className="w-5 h-5" /> },
    { key: "announcements", href: `/${locale}/duyurular`, icon: <Megaphone className="w-5 h-5" /> },
    { key: "notifications", href: `/${locale}/bildirimler`, icon: <Bell className="w-5 h-5" /> },
    { key: "profile", href: `/${locale}/profil`, icon: <User className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 z-40 flex-col bg-ml-dark/95 backdrop-blur-lg border-r border-ml-dark-border">
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <a
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-ml-red/10 text-ml-red border border-ml-red/20"
                  : "text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-card"
              )}
            >
              <div className="relative">
                {item.icon}
                {item.key === "notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-ml-red text-white text-[9px] font-bold animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              {t(item.key)}
            </a>
          );
        })}

        {role === "admin" && (
          <>
            <div className="my-3 border-t border-ml-dark-border" />
            <a
              href={`/${locale}/admin`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                pathname.startsWith(`/${locale}/admin`)
                  ? "bg-ml-red/10 text-ml-red border border-ml-red/20"
                  : "text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-card"
              )}
            >
              <Shield className="w-5 h-5" />
              {t("admin")}
            </a>
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-ml-dark-border space-y-1">
        <a
          href={`/${locale}/ayarlar`}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
            pathname.startsWith(`/${locale}/ayarlar`)
              ? "bg-ml-red/10 text-ml-red border border-ml-red/20"
              : "text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-card"
          )}
        >
          <Settings className="w-5 h-5" />
          {t("settings")}
        </a>
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}/giris` })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ml-gray-400 hover:text-ml-red hover:bg-ml-dark-card transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
