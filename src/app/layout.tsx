import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Move League | Küresel Dans Yarışma Platformu",
    template: "%s | Move League",
  },
  description:
    "Move League, dansçıların ELO puanlama sistemiyle düello ettiği, atölyelere katıldığı, takımlar kurduğu ve küresel sıralamalarda yarıştığı online dans yarışma platformudur. Salsa, Bachata, Hip-Hop, K-Pop ve daha fazlası.",
  keywords: [
    "dans yarışması",
    "dance battle",
    "ELO rating",
    "salsa",
    "bachata",
    "hip-hop",
    "kpop",
    "dans düellosu",
    "move league",
    "dans platformu",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Move League | Küresel Dans Yarışma Platformu",
    description:
      "Dansçıların ELO puanlama sistemiyle düello ettiği, atölyelere katıldığı ve küresel sıralamalarda yarıştığı online dans platformu.",
    siteName: "Move League",
    type: "website",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Move League | Küresel Dans Yarışma Platformu",
    description:
      "Dansçıların ELO puanlama sistemiyle düello ettiği, atölyelere katıldığı ve küresel sıralamalarda yarıştığı online dans platformu.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#E31937",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
