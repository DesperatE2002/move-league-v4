import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import Providers from "@/components/Providers";

export default async function PlatformLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user) {
    redirect(`/${locale}/giris`);
  }

  return (
    <Providers>
      <TopBar userName={session.user.name || ""} role={session.user.role} />
      <main className="pt-16 pb-20 min-h-screen">
        <div className="max-w-lg mx-auto px-4 py-4">{children}</div>
      </main>
      <BottomNav role={session.user.role} />
    </Providers>
  );
}
