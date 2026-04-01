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
} from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface NavItem {
  key: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

export default function BottomNav({ role }: { role: string }) {
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
    {
      key: "home",
      href: `/${locale}/anasayfa`,
      icon: <Home className="w-5 h-5" />,
    },
    {
      key: "battles",
      href: `/${locale}/duellolar`,
      icon: <Swords className="w-5 h-5" />,
    },
    {
      key: "workshops",
      href: `/${locale}/atolyeler`,
      icon: <GraduationCap className="w-5 h-5" />,
    },
    {
      key: "notifications",
      href: `/${locale}/bildirimler`,
      icon: <Bell className="w-5 h-5" />,
    },
    {
      key: "feedback",
      href: `/${locale}/geri-bildirim`,
      icon: <MessageSquarePlus className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-ml-dark/95 backdrop-blur-lg border-t border-ml-dark-border safe-area-bottom lg:hidden">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
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
      </div>
    </nav>
  );
}
