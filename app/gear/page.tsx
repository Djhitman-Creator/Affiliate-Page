import type { Metadata } from "next";
import GearPageClient from "./GearPageClient";

export const metadata: Metadata = {
  title: "Karaoke Equipment & Gear | Microphones, Machines & Accessories | KaraTrack+",
  description: "Shop the best karaoke equipment including karaoke machines, wireless microphones, speakers, and karaoke track collections. Trusted recommendations from KaraTrack+ for home and professional KJ setups.",
  keywords: "karaoke equipment, karaoke machines, karaoke microphones, wireless microphones, karaoke speakers, karaoke accessories, karaoke tracks, KJ equipment, home karaoke, professional karaoke gear",
  openGraph: {
    title: "Karaoke Equipment & Gear | KaraTrack+",
    description: "Shop the best karaoke equipment including machines, microphones, speakers, and track collections. Trusted recommendations for home and professional setups.",
    url: "https://karatrack.com/gear",
    siteName: "KaraTrack+",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Karaoke Equipment & Gear | KaraTrack+",
    description: "Shop the best karaoke equipment including machines, microphones, speakers, and track collections.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://karatrack.com/gear",
  },
};

export default function GearPage() {
  return <GearPageClient />;
}