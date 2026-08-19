import './globals.css'
import type { ReactNode } from 'react'
import Providers from './providers'
import StructuredData from '@/components/StructuredData'
import MobileNav from "@/components/MobileNav"
import SiteFooterContent from '@/components/SiteFooterContent'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LocaleProvider, LanguageSwitcher, NavLinks, LoginPill } from '@/lib/i18n'
import { MAIN_SITE_URL } from '@/lib/site-config'

// Canonical host for the search engine after the Aug 2026 domain swap.
const BASE_URL = 'https://search.karatrack.com'

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'Professional Karaoke Downloads | Search 100,000+ Songs | Karatrack',
  description: 'Search professional karaoke downloads instantly. Over 100,000 karaoke songs from Party Tyme and Karaoke Version in MP3, MP4, and KFN formats — updated daily with new releases.',
  keywords: 'karaoke downloads, professional karaoke downloads, karaoke tracks, karaoke songs, party tyme karaoke, karaoke version, backing tracks, karaoke mp3, download karaoke, professional karaoke, karaoke with lyrics, karaoke search engine',
  authors: [{ name: 'Rush Monkey LLC' }],
  creator: 'Karatrack',
  publisher: 'Rush Monkey LLC',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Professional Karaoke Downloads | Karatrack Search Engine',
    description: 'Search over 100,000 professional karaoke downloads from Party Tyme & Karaoke Version. MP3, MP4, and KFN formats, updated daily.',
    url: BASE_URL,
    siteName: 'Karatrack Search Engine',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Professional Karaoke Downloads | 100,000+ Songs | Karatrack',
    description: 'Search professional karaoke downloads from Party Tyme & Karaoke Version. Instant results in multiple formats.',
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
    canonical: BASE_URL,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <LocaleProvider>
            {/* Sticky header — mirrors the main karatrack.com SiteHeader.
                Help + TOS moved to the footer (Aug 2026) to match the main
                site's clean header. */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
                <a href={MAIN_SITE_URL} className="flex items-baseline gap-2 text-xl font-black tracking-tight">
                  <span>
                    Kara<span className="text-cyan-500">track</span>
                  </span>
                  <span className="hidden text-xs font-semibold uppercase tracking-widest text-slate-400 sm:inline dark:text-slate-500">
                    Songs
                  </span>
                </a>

                {/* Same five links as the main site, pointing back to it */}
                <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
                  <NavLinks />
                </nav>

                <div className="flex items-center gap-3">
                  <LanguageSwitcher />
                  <ThemeToggle />
                  <span className="hidden sm:inline-flex">
                    <LoginPill />
                  </span>
                  <span className="md:hidden">
                    <MobileNav />
                  </span>
                </div>
              </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-8">
              {children}
            </main>

            {/* Footer — mirrors the main karatrack.com SiteFooter, plus the
                Help/TOS modals and the required non-affiliation disclaimer. */}
            <footer className="border-t border-slate-200 px-6 py-10 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <SiteFooterContent />
            </footer>
            <StructuredData />
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  )
}
