import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pano",
  description:
    "Bugün, bu hafta, bu ay — DenTracker panosunda çalışma saatlerini grafikler ve serilerle özetler. Hedefini ne zaman tutturduğunu tek bakışta gör.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
