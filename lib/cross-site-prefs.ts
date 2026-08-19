// ============================================================================
// Cross-site preference cookies — shared with www.karatrack.com.
// ============================================================================
// The theme (light/dark/system) and language choices are stored in cookies
// scoped to `.karatrack.com`, so every subdomain (www, search, …) sees the
// same values. Pick Spanish + dark mode on either site and the other follows.
//
// The SAME two cookie names are used by the main karatrack-website repo
// (src/lib/cross-site-prefs.ts) — keep them in sync if they ever change:
//   KT_THEME — "light" | "dark" | "system"
//   KT_LANG  — one of the 13 shared locale codes ("en", "es", … "zh-TW")
//
// On localhost / vercel.app previews a `.karatrack.com` cookie can't be set,
// so we fall back to a host-only cookie — everything still works, it just
// doesn't cross domains there (it can't; they're different sites).
// ============================================================================

export const THEME_COOKIE = 'KT_THEME'
export const LANG_COOKIE = 'KT_LANG'

const ONE_YEAR = 31536000

function sharedDomainSuffix(): string {
  if (
    typeof location !== 'undefined' &&
    (location.hostname === 'karatrack.com' || location.hostname.endsWith('.karatrack.com'))
  ) {
    return '; domain=.karatrack.com'
  }
  return ''
}

/** Read a cookie by name (first match wins). Returns null when absent. */
export function readPrefCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`))
  return m ? decodeURIComponent(m[1]) : null
}

/** Write a preference cookie visible to every *.karatrack.com site. */
export function writeSharedPrefCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  document.cookie =
    `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; SameSite=Lax${sharedDomainSuffix()}`
}

/** Expire a legacy host-only cookie so it can't shadow the shared one. */
export function expireHostCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}
