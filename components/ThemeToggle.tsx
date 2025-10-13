'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    // neutral placeholder to avoid hydration mismatch
    return (
      <button
        aria-label="Toggle theme"
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-black/10 px-3 text-sm
                   hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
      >
        <Sun className="h-4 w-4" />
        <span className="hidden sm:inline">Theme</span>
      </button>
    )
  }

  const isDark = (resolvedTheme ?? theme) === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-pressed={isDark}
      aria-label="Toggle theme"
      className="inline-flex h-9 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-sm
                 hover:bg-black/5 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:hover:bg-white/10"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  )
}
