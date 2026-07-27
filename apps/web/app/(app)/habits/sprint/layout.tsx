import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sprint",
  description: "Alışkanlık sprintini planla, ilerlemeyi izle, retro ile kapat.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HabitsSprintLayout({ children }: { children: React.ReactNode }) {
  return children;
}
