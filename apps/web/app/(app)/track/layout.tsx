import type { Metadata } from "next";

// Server component sibling of the client `page.tsx` so we can export
// `metadata` (client components can't). Renders children unchanged.
export const metadata: Metadata = {
  title: "Takip",
  description:
    "Çalışmaya oturduğunda başlat'a, kalktığında durdur'a bas. DenTracker; günün hangi saatinde ne kadar çalıştığını ve molalarını arka planda saklar.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
