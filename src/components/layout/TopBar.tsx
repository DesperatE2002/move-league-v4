"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Settings, Shield } from "lucide-react";

interface TopBarProps {
  userName: string;
  role: string;
}

export default function TopBar({ userName, role }: TopBarProps) {
  const t = useTranslations("nav");
  const params = useParams();
  const locale = params.locale as string;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-ml-dark/95 backdrop-blur-lg border-b border-ml-dark-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg lg:max-w-full lg:pl-68 mx-auto">
        {/* Logo */}
        <a href={`/${locale}/anasayfa`} className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Move League"
            width={36}
            height={36}
            className="rounded"
          />
          <span className="text-lg font-bold text-ml-white">
            Move<span className="text-ml-red">League</span>
          </span>
        </a>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <a
              href={`/${locale}/admin`}
              className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-red hover:bg-ml-dark-card transition-all"
              title={t("admin")}
            >
              <Shield className="w-5 h-5" />
            </a>
          )}
          <a
            href={`/${locale}/ayarlar`}
            className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-red hover:bg-ml-dark-card transition-all"
            title={t("settings")}
          >
            <Settings className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
}
