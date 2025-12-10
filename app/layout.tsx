import './globals.css'
import type { ReactNode } from 'react'
import Providers from './providers'
import HeaderModals from "@/components/HeaderModals"
import StructuredData from '@/components/StructuredData'
import { ThemeToggle } from "@/components/ThemeToggle"

export const metadata = {
  title: 'KaraTrack+ | Download Over 100,000 Karaoke Songs | Party Tyme & Karaoke Version',
  description: 'Search and download professional karaoke tracks instantly. Over 100,000 songs from Party Tyme Karaoke and Karaoke Version. MP3, MP4, KFN formats. Updated daily with new releases.',
  keywords: 'karaoke downloads, karaoke tracks, karaoke songs, party tyme karaoke, karaoke version, backing tracks, karaoke mp3, download karaoke, professional karaoke, karaoke with lyrics',
  authors: [{ name: 'Rush Monkey Gaming LLC' }],
  creator: 'KaraTrack+',
  publisher: 'Rush Monkey Gaming LLC',
  openGraph: {
    title: 'KaraTrack+ | Professional Karaoke Downloads',
    description: 'Search over 100,000 karaoke tracks from Party Tyme & Karaoke Version. Download MP3, MP4, KFN formats instantly.',
    url: 'https://karatrack.com',
    siteName: 'KaraTrack+',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KaraTrack+ | Over 100,000 Karaoke Downloads',
    description: 'Search professional karaoke tracks from Party Tyme & Karaoke Version. Instant downloads in multiple formats.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://karatrack.com',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="min-h-screen px-4 md:px-8 py-8">
            {/* Top header: keep text white in BOTH themes for contrast */}
            <header className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/karatrack-logo.png"
                  alt="KaraTrack+ Logo"
                  className="w-10 h-10 rounded-2xl object-contain"
                />
                <div>
                  <h1 className="text-xl font-semibold text-white">KaraTrack+</h1>
                  <p className="text-xs text-white/70 -mt-1">Modern Karaoke Search Engine</p>
                </div>
              </div>

              {/* Right side of header with KJ Tools, Help, TOS, and Theme Toggle */}
              <div className="flex items-center gap-3">
                <a href="/tools/index.html" className="kj-tools-pill">
                  <span>🛠️</span>
                  KJ Tools
                  <span className="badge">NEW</span>
                </a>
                <a href="/gear" className="kj-tools-pill" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <span>🛒</span>
                  Gear
                </a>
                <HeaderModals />
                <ThemeToggle />
              </div>
            </header>

            {children}

            <footer className="mt-10 text-center text-xs text-neutral-500 dark:text-white/50">
              © Rush Monkey Gaming LLC
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
