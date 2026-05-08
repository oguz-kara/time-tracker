import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ReactQueryProvider } from "@/lib/query-client";
import { PostHogProvider } from "@/modules/analytics/provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
  display: "swap",
});

/**
 * Root metadata. Per-page files override `title` (via the template) and
 * `description`. Open Graph + Twitter defaults inherit unless a page sets
 * them explicitly.
 *
 * Title pattern: each page provides its own title; the template wraps it
 * as "<page> · DenTracker". The bare landing page uses `title.default`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://dentracker.fun"
  ),
  title: {
    default: "DenTracker — Sade kişisel zaman takipçisi",
    template: "%s · DenTracker",
  },
  description:
    "Evden çalışırken günü kaybetme. Otururken başlat, kalktığında durdur. Çalıştığın saatleri ve molalarını sade bir arayüzde tek bakışta gör.",
  applicationName: "DenTracker",
  keywords: [
    "zaman takibi",
    "kişisel zaman takipçisi",
    "evden çalışma",
    "mola takibi",
    "verimlilik",
    "time tracker",
  ],
  authors: [{ name: "DenTracker" }],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "DenTracker",
    title: "DenTracker — Sade kişisel zaman takipçisi",
    description:
      "Otururken başlat, kalktığında durdur. Gerçekten kaç saat çalıştığını gör.",
  },
  twitter: {
    card: "summary",
    title: "DenTracker",
    description:
      "Otururken başlat, kalktığında durdur. Gerçekten kaç saat çalıştığını gör.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className={`${inter.variable} ${mono.variable} font-sans`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PostHogProvider>
            <ReactQueryProvider>{children}</ReactQueryProvider>
          </PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
