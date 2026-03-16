import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function LocaleIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (session?.user) {
    redirect(`/${locale}/anasayfa`);
  } else {
    redirect(`/${locale}/giris`);
  }
}
