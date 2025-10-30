import './globals.css'
import type { ReactNode } from 'react'
import Providers from './providers'

export const metadata = {
  title: 'KaraTrack+ – Modern Karaoke Affiliate Search',
  description:
    'Search-as-you-type across Party Tyme and Karaoke Version with sortable columns and YouTube karaoke links.',
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
                <div className="w-10 h-10 rounded-2xl glass grid place-items-center text-xl">🎤</div>
                <div>
                  <h1 className="text-xl font-semibold text-white">KaraTrack+</h1>
                  <p className="text-xs text-white/70 -mt-1">Modern Karaoke Search Engine</p>
                </div>
              </div>
            </header>

            {children}

            <footer className="mt-10 text-center text-xs text-neutral-500 dark:text-white/50">
              Built for Karaoke Houston • Next.js + Tailwind + Prisma
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
