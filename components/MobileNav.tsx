'use client'

import { useState } from 'react'
import { Menu, X, HelpCircle, FileText } from 'lucide-react'
import { useT, MAIN_SITE_LINKS, LoginPill } from '@/lib/i18n'
import { HelpModal, TosModal } from '@/components/HeaderModals'

export default function MobileNav() {
  const { t } = useT()
  const [isOpen, setIsOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showTOS, setShowTOS] = useState(false)

  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:text-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={closeMenu}
        >
          {/* Menu Panel */}
          <div
            className="absolute right-0 top-0 h-full w-72 border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Kara<span className="text-cyan-500">track</span>
              </span>
              <button
                onClick={closeMenu}
                className="p-2 text-slate-500 transition hover:text-cyan-500 dark:text-slate-400"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Menu Items — same five links as the main site header */}
            <nav className="space-y-1 p-4">
              {MAIN_SITE_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="block rounded-xl p-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-cyan-500 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  {t(link.key)}
                </a>
              ))}

              <div className="my-3 border-t border-slate-200 dark:border-slate-800"></div>

              {/* Help */}
              <button
                onClick={() => {
                  closeMenu()
                  setShowHelp(true)
                }}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-cyan-500 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <HelpCircle className="h-4 w-4 text-cyan-500" />
                {t('help')}
              </button>

              {/* TOS */}
              <button
                onClick={() => {
                  closeMenu()
                  setShowTOS(true)
                }}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-cyan-500 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                {t('tos')}
              </button>

              <div className="my-3 border-t border-slate-200 dark:border-slate-800"></div>

              <div className="p-3">
                <LoginPill />
              </div>
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4 dark:border-slate-800">
              <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                © Rush Monkey LLC
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shared modals (same components the desktop header uses) */}
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      <TosModal open={showTOS} onClose={() => setShowTOS(false)} />
    </>
  )
}
