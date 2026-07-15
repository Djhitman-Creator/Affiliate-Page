'use client';

import { useT } from '@/lib/i18n';

// The translated subtitle under the Karatrack Search Engine wordmark.
// Lives in its own client component so app/layout.tsx can stay a server
// component (it exports metadata, which client components cannot).
export default function HeaderTagline() {
  const { t } = useT();
  return (
    <p className="-mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
      {t('tagline')}
    </p>
  );
}
