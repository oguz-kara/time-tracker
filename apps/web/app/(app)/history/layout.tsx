import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Geçmiş",
  description:
    "Geçmiş günlerde ne yaptığını DenTracker geçmişinde gör — tarihe göre gez, dünkü kayıtlara dön, eksik bir saati ekle veya düzelt.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
