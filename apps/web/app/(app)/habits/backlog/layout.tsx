import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backlog",
  description: "Edinmek ya da bırakmak istediğin alışkanlıkların birikim listesi.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HabitsBacklogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
