'use client'

import { X, HelpCircle, FileText } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useT } from '@/lib/i18n'

/* ============================================================================
   Help + TOS modals, shared by the desktop header and the mobile menu.
   Button labels are translated; the long-form Help and Terms content stays
   in English intentionally (legal text should not be machine-translated
   without review).
============================================================================ */

function ModalShell({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="sticky top-0 flex items-center justify-between p-6"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 transition hover:opacity-80"
            style={{ color: 'var(--text-dim)' }}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-6">
          <div className="space-y-4" style={{ color: 'var(--text-dim)' }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--surface-2)', borderLeft: '3px solid var(--copper)' }}
    >
      <p className="mb-2 font-semibold" style={{ color: 'var(--amber)' }}>{title}</p>
      <div style={{ color: 'var(--text-dim)' }}>{children}</div>
    </div>
  )
}

const Strong = ({ children }: { children: ReactNode }) => (
  <span className="font-semibold" style={{ color: 'var(--text)' }}>{children}</span>
)

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ModalShell open={open} onClose={onClose} title="How To Search Karaoke Downloads">
      <Callout title="🔍 Important Note">
        <p>
          We have separate fields for Artist and Title. This is because our site updates daily so
          that the results will be from the most recently released tracks. When searching the
          database for legacy tracks, please be patient as the search will take longer.
        </p>
      </Callout>

      <p>
        The Karatrack database is designed to make finding your preferred karaoke downloads very
        simple for any track. Just type in the parts of the title and/or Artist that you know
        within their selected fields. For instance, in the artist field, <Strong>&quot;Fra Sin&quot;</Strong>{' '}
        will bring up results for <Strong>&quot;Frank Sinatra&quot;</Strong> while in the song title field,{' '}
        <Strong>&quot;Fl Me Moon&quot;</Strong> will bring up results for <Strong>&quot;Fly Me to the Moon&quot;</Strong>.
      </p>

      <Callout title="💡 Pro Tips">
        <p>
          We recommend that you do not use special characters such as punctuation or symbols. This
          will ultimately limit your search results. An example would be to search{' '}
          <Strong>&quot;Panic At The Disco&quot;</Strong> instead of <Strong>&quot;Panic! At The Disco&quot;</Strong>. Some
          karaoke manufacturers do not include the exclamation point in the titles.
        </p>
      </Callout>

      <p>
        We recommend leaving out common words like <Strong>&quot;The&quot;, &quot;And&quot;, &quot;I&quot;, &quot;A&quot;</Strong> as it will
        help prevent unnecessary results. Just include main words or parts of the words that you
        know.
      </p>

      <p>
        Duplicate words in a song do not need to be entered into the search bar more than once. An
        example would be <Strong>&quot;John Lee Hooker – Boom Boom Boom&quot;</Strong> entered as{' '}
        <Strong>&quot;John Lee Hooker - Boom&quot;</Strong>. Once this becomes a habit, it will feel natural to
        search this way for karaoke downloads.
      </p>

      <Callout title="🔗 Downloading Tracks">
        <p>
          To get a track, follow the highlighted link. Once at the manufacturer&apos;s site, ensure that
          you are paying for the karaoke download in the format that you require. Karaoke Version
          tracks can be downloaded in multiple formats once you purchase the track. Party Tyme
          tracks require you to select your chosen format prior to purchasing. Check our Terms of
          Service before downloading any links from Karatrack.
        </p>
      </Callout>

      <Callout title="📱 Need Help?">
        <p>
          If you have any problem with our search engine, please reach out to us on Facebook — just
          search Karatrack! We will be happy to assist you with any issues you might encounter.
          Thank you!
        </p>
      </Callout>
    </ModalShell>
  )
}

export function TosModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ModalShell open={open} onClose={onClose} title="Terms of Service">
      <Callout title="⚠️ Legal Notice">
        <p>
          All karaoke tracks may not be legal for public or monetized services. It is every
          individual&apos;s responsibility to check with the track manufacturer to determine its legal
          usage rights. Karatrack does not produce the music or synchronize lyrics.
        </p>
      </Callout>

      <Callout title="📀 Legacy Tracks">
        <p>
          Karatrack also provides legacy tracks for reference. These are tracks that may or may not
          be available from disc manufacturers or overseas sellers. Please check the terms provided
          by each manufacturer to determine legality of public performances for each individual
          brand.
        </p>
      </Callout>

      <Callout title="🛒 Purchasing Guidelines">
        <p>
          Please be sure that if you download a track from Party Tyme, you select the proper format
          prior to purchase. We are in no way responsible for any purchases you make that are
          delivered in the wrong format. Karaoke Version will allow you to choose your format after
          purchase from their site. Any questions, concerns or disputes must be made with the
          karaoke track manufacturer and not with Karatrack.
        </p>
      </Callout>

      <Callout title="⚖️ Your Responsibility">
        <p>
          Remember, it is everyone&apos;s responsibility to do their own research. Ignorance of the law
          is no excuse. Karatrack will not be held responsible for any legal action arising from the
          use of any tracks found through this site. YouTube tracks are for your reference only or
          practicing at home.
        </p>
      </Callout>

      <div className="rounded-2xl p-4 text-center text-sm" style={{ background: 'var(--surface-2)' }}>
        <p style={{ color: 'var(--text-dim)' }}>
          By using the Karatrack Search Engine, you acknowledge and agree to these terms of service.
        </p>
      </div>
    </ModalShell>
  )
}

/* Desktop header buttons (Help + TOS) */
export default function HeaderModals() {
  const { t } = useT()
  const [showHelp, setShowHelp] = useState(false)
  const [showTOS, setShowTOS] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={() => setShowHelp(true)} className="btn" aria-label={t('help')}>
          <HelpCircle className="h-4 w-4" style={{ color: 'var(--amber)' }} />
          <span>{t('help')}</span>
        </button>
        <button onClick={() => setShowTOS(true)} className="btn" aria-label={t('tos')}>
          <FileText className="h-4 w-4" style={{ color: 'var(--text-dim)' }} />
          <span>{t('tosShort')}</span>
        </button>
      </div>

      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      <TosModal open={showTOS} onClose={() => setShowTOS(false)} />
    </>
  )
}
