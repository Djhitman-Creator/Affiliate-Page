import './globals.css'
import type { ReactNode } from 'react'
import Providers from './providers'
import HeaderModals from "@/components/HeaderModals"
import StructuredData from '@/components/StructuredData'
import MobileNav from "@/components/MobileNav"
import { ThemeToggle } from '@/components/ThemeToggle'
import { LocaleProvider, LanguageSwitcher, NavLinks, LoginPill } from '@/lib/i18n'
import { MAIN_SITE_LIVE } from '@/lib/site-config'

export const metadata = {
  title: 'Karatrack Search Engine | Search 100,000+ Karaoke Songs | Party Tyme & Karaoke Version',
  description: 'Search professional karaoke tracks instantly. Over 100,000 songs from Party Tyme Karaoke and Karaoke Version. MP3, MP4, KFN formats. Updated daily with new releases.',
  keywords: 'karaoke downloads, karaoke tracks, karaoke songs, party tyme karaoke, karaoke version, backing tracks, karaoke mp3, download karaoke, professional karaoke, karaoke with lyrics, karaoke search engine',
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
    title: 'Karatrack Search Engine | Professional Karaoke Downloads',
    description: 'Search over 100,000 karaoke tracks from Party Tyme & Karaoke Version. Download MP3, MP4, KFN formats instantly.',
    url: 'https://songs.karatrack.com',
    siteName: 'Karatrack Search Engine',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Karatrack Search Engine | 100,000+ Karaoke Downloads',
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
    canonical: 'https://songs.karatrack.com',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <LocaleProvider>
            {/* Sticky header — mirrors the main karatrack.com SiteHeader */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
                <a href="https://karatrack.com" className="flex items-baseline gap-2 text-xl font-black tracking-tight">
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
                  <div className="hidden items-center gap-3 md:flex">
                    <HeaderModals />
                  </div>
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

            {/* Footer — mirrors the main karatrack.com SiteFooter */}
            <footer className="border-t border-slate-200 px-6 py-10 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p>© {new Date().getFullYear()} Rush Monkey LLC</p>
                {MAIN_SITE_LIVE && (
                  <div className="flex gap-4">
                    <a href="https://karatrack.com/contact" className="hover:text-cyan-500">Contact</a>
                    <a href="https://karatrack.com/support" className="hover:text-cyan-500">Support</a>
                    <a href="https://karatrack.com" className="hover:text-cyan-500">Karatrack.com</a>
                  </div>
                )}
              </div>
              <p className="mx-auto mt-6 max-w-7xl text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                Karatrack is an independent karaoke track search and software company.
                Party Tyme, Karaoke Version, and other brand names are trademarks of their
                respective owners. Karatrack is not affiliated with, sponsored by, or
                endorsed by those companies.
              </p>
            </footer>
            <StructuredData />
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  )
}
