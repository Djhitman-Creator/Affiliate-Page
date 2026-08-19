'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n'
import { MAIN_SITE_LIVE, MAIN_SITE_URL } from '@/lib/site-config'
import { HelpModal, TosModal } from '@/components/HeaderModals'

/* ============================================================================
   SiteFooterContent — the inside of the footer, mirroring the main
   karatrack.com SiteFooter: copyright on the left, the Facebook
   "Join our community" pill in the center, and the link row on the right.

   The Help and Terms of Service buttons live HERE (not in the header) per
   James's Aug 2026 decision — they open the same modals as before, and the
   labels are translated in all 13 languages.

   It's a client component because the Help/TOS modals need open/close state
   and the labels come from the client-side i18n hook. app/layout.tsx (a
   server component, it exports metadata) just drops this inside <footer>.
============================================================================ */

// Facebook "f" mark as inline SVG — same one the main site's SiteFooter
// draws (lucide is phasing out brand icons). Inherits color via currentColor.
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M13.5 21v-8.2h2.77l.41-3.2H13.5V7.55c0-.93.26-1.56 1.6-1.56h1.7V3.13c-.3-.04-1.3-.13-2.47-.13-2.44 0-4.12 1.49-4.12 4.23v2.36H7.5v3.2h2.71V21h3.29z" />
    </svg>
  )
}

export default function SiteFooterContent() {
  const { t } = useT()
  const [showHelp, setShowHelp] = useState(false)
  const [showTOS, setShowTOS] = useState(false)
  const year = new Date().getFullYear()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <p>© {year} Rush Monkey LLC</p>

        {/* Community call-to-action — identical styling to the main site's
            footer button, centered between copyright and the link row. */}
        <a
          href="https://www.facebook.com/karatrack"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-6 py-3 font-bold text-white shadow-lg shadow-[#1877F2]/20 transition hover:bg-[#0f6ae0]"
        >
          <FacebookIcon />
          {t('joinCommunity')}
        </a>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {MAIN_SITE_LIVE && (
            <>
              <a href={`${MAIN_SITE_URL}/contact`} className="transition hover:text-cyan-500">
                {t('contact')}
              </a>
              <a href={`${MAIN_SITE_URL}/support`} className="transition hover:text-cyan-500">
                {t('support')}
              </a>
              <a href={MAIN_SITE_URL} className="transition hover:text-cyan-500">
                Karatrack.com
              </a>
            </>
          )}
          {/* Help + TOS — moved here from the header (Aug 2026). Same modals. */}
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="transition hover:text-cyan-500"
          >
            {t('help')}
          </button>
          <button
            type="button"
            onClick={() => setShowTOS(true)}
            className="transition hover:text-cyan-500"
          >
            {t('tos')}
          </button>
        </div>
      </div>

      {/* Trademark / non-affiliation disclaimer — REQUIRED, do not remove. */}
      <p className="mt-6 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        Karatrack is an independent karaoke track search and software company.
        Party Tyme, Karaoke Version, KaraFun, and other brand names are trademarks
        of their respective owners. Karatrack is not affiliated with, sponsored by,
        or endorsed by those companies.
      </p>

      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      <TosModal open={showTOS} onClose={() => setShowTOS(false)} />
    </div>
  )
}
