import { getTranslations } from "next-intl/server";
import { GraduationCap, Clock } from "lucide-react";

export default async function WorkshopsPage() {
  const t = await getTranslations("nav");

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold text-ml-white">{t("workshops")}</h1>

      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
        <div className="inline-flex p-4 rounded-full bg-ml-info/10 mb-4">
          <GraduationCap className="w-8 h-8 text-ml-info" />
        </div>
        <h2 className="text-lg font-semibold text-ml-white mb-2">
          Atölye Sistemi
        </h2>
        <p className="text-sm text-ml-gray-400 mb-4">
          Atölye modülü Faz 4&apos;te aktif olacaktır. Koçlardan canlı ve video dersler alabileceksin!
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ml-warning/10 text-ml-warning text-xs font-medium border border-ml-warning/20">
          <Clock className="w-3 h-3" />
          Yakında
        </div>
      </div>
    </div>
  );
}
