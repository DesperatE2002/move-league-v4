import Providers from "@/components/Providers";

export default function CompleteProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
