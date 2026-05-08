import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tercihler",
  description:
    "Günlük hedefini, hafta başlangıcını, saat dilimini ve dili DenTracker tercihlerinden ayarla. Tek kullanıcılık, tek ekran.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsTrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
