// ============================================================================
// Site-wide launch switch + main-site URL.
// ============================================================================
// The main karatrack.com product site launched in August 2026 (domain moved
// to www.karatrack.com), so every link that leads visitors to the main site
// is now visible: header nav (Products/Pricing/Roadmap/Updates/Support), the
// Login pill, and the footer Contact/Support links.
//
// If the main site ever needs to be hidden again, change `true` to `false`
// below and push. That's the whole step.
// ============================================================================

export const MAIN_SITE_LIVE = true;

// Canonical main-site origin — www is the canonical host after the Aug 2026
// domain swap. Every outbound link to the main site is built from this.
export const MAIN_SITE_URL = 'https://www.karatrack.com';
