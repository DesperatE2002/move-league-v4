import { getTranslations } from "next-intl/server";
import { Users, Clock } from "lucide-react";

export default async function TeamsPage() {
  const t = await getTranslations("nav");

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold text-ml-white">{t("teams")}</h1>

      <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
        <div className="inline-flex p-4 rounded-full bg-purple-500/10 mb-4">
          <Users className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-lg font-semibold text-ml-white mb-2">
          Takım Sistemi
        </h2>
        <p className="text-sm text-ml-gray-400 mb-4">
          Takım ve yarışma sistemi Faz 5&apos;te aktif olacaktır. Takımlar kurabilir ve yarışmalara katılabileceksin!
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ml-warning/10 text-ml-warning text-xs font-medium border border-ml-warning/20">
          <Clock className="w-3 h-3" />
          Yakında
        </div>
      </div>
    </div>
  );
}
