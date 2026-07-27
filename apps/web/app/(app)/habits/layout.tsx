import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alışkanlıklar",
  description:
    "İyi alışkanlıklar edin, kötülerini bırak. DenTracker alışkanlıklarını backlog ve sprintlerle, Atomic Habits usulü takip eder.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HabitsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
