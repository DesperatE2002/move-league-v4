"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, usePathname } from "next/navigation";
import {
  Home,
  Swords,
  GraduationCap,
  Users,
  Trophy,
  Bell,
  User,
  Settings,
  Shield,
  LogOut,
  MessageSquarePlus,
  Medal,
  Megaphone,
  CalendarDays,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface NavItem {
  key: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  judgeOnly?: boolean;
}

export default function BottomNav({ role }: { role: string }) {
  const t = useTranslations("nav");
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const [unreadCount, setUnreadCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

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

  // Primary items shown directly in the bar
  const primaryItems: NavItem[] = [
    { key: "home", href: `/${locale}/anasayfa`, icon: <Home className="w-5 h-5" /> },
    { key: "battles", href: `/${locale}/duellolar`, icon: <Swords className="w-5 h-5" /> },
    { key: "rankings", href: `/${locale}/siralama`, icon: <Trophy className="w-5 h-5" /> },
    { key: "notifications", href: `/${locale}/bildirimler`, icon: <Bell className="w-5 h-5" /> },
  ];

  // Secondary items shown in the "More" menu
  const moreItems: NavItem[] = [
    { key: "workshops", href: `/${locale}/atolyeler`, icon: <GraduationCap className="w-5 h-5" /> },
    { key: "teams", href: `/${locale}/takimlar`, icon: <Users className="w-5 h-5" /> },
    { key: "competitions", href: `/${locale}/yarisma`, icon: <Medal className="w-5 h-5" /> },
    { key: "announcements", href: `/${locale}/duyurular`, icon: <Megaphone className="w-5 h-5" /> },
    ...(role === "judge" || role === "admin"
      ? [{ key: "schedule", href: `/${locale}/hakem-programi`, icon: <CalendarDays className="w-5 h-5" /> }]
      : []),
    { key: "profile", href: `/${locale}/profil`, icon: <User className="w-5 h-5" /> },
    { key: "feedback", href: `/${locale}/geri-bildirim`, icon: <MessageSquarePlus className="w-5 h-5" /> },
    { key: "settings", href: `/${locale}/ayarlar`, icon: <Settings className="w-5 h-5" /> },
    ...(role === "admin"
      ? [{ key: "admin", href: `/${locale}/admin`, icon: <Shield className="w-5 h-5" /> }]
      : []),
  ];

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More menu sheet */}
      <div
        className={cn(
          "fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 lg:hidden transition-all duration-300 ease-out",
          moreOpen
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="mx-3 mb-2 bg-ml-dark border border-ml-dark-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-4 gap-1 p-3">
            {moreItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <a
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-all",
                    isActive
                      ? "bg-ml-red/10 text-ml-red"
                      : "text-ml-gray-400 hover:text-ml-gray-200 hover:bg-ml-dark-card"
                  )}
                >
                  {item.icon}
                  <span className="text-[10px] font-medium leading-tight text-center">
                    {t(item.key)}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Logout button */}
          <div className="border-t border-ml-dark-border px-3 py-2">
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}/giris` })}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-ml-gray-400 hover:text-ml-red hover:bg-ml-dark-card transition-all"
            >
              <LogOut className="w-5 h-5" />
              {t("logout")}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-ml-dark/95 backdrop-blur-lg border-t border-ml-dark-border safe-area-bottom lg:hidden">
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {primaryItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <a
                key={item.key}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-14",
                  isActive
                    ? "text-ml-red"
                    : "text-ml-gray-500 hover:text-ml-gray-300"
                )}
              >
                <div className={cn(
                  "relative",
                  isActive && "drop-shadow-[0_0_8px_rgba(227,25,55,0.6)]"
                )}>
                  {item.icon}
                  {item.key === "notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-ml-red text-white text-[9px] font-bold animate-pulse">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{t(item.key)}</span>
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-0.5 bg-ml-red rounded-full" />
                )}
              </a>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-14",
              moreOpen || isMoreActive
                ? "text-ml-red"
                : "text-ml-gray-500 hover:text-ml-gray-300"
            )}
          >
            <div className={cn(
              "relative",
              (moreOpen || isMoreActive) && "drop-shadow-[0_0_8px_rgba(227,25,55,0.6)]"
            )}>
              {moreOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </div>
            <span className="text-[10px] font-medium">
              {moreOpen ? t("close") || "Kapat" : t("more") || "Daha"}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
