import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
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
      <Sidebar role={session.user.role} />
      <main className="pt-16 pb-20 lg:pb-0 lg:pl-64 min-h-screen">
        <div className="max-w-lg lg:max-w-5xl mx-auto px-4 lg:px-8 py-4">{children}</div>
      </main>
      <BottomNav role={session.user.role} />
    </Providers>
  );
}
