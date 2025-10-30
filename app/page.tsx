'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

type Row = {
  id?: string | number | null;
  artist: string;
  title: string;
  source: string;
  brand?: string | null;
  brandDisplay?: string | null;
  purchaseUrl?: string | null;
  buyUrl?: string | null;
  trackId?: string | null;
};

type YTHit = {
  label: string;
  handle: string;
  title: string;
  videoId: string;
  url: string;
  thumbnail?: string | null;
};

const PAGE_SIZE = 25;

/* ---------- helpers ---------- */
function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// host check
function isKaraokeVersionHost(u: string) {
  try {
    return /(^|\.)karaoke-version\.com$/i.test(new URL(u).hostname);
  } catch {
    return false;
  }
}

// title slug from KV url: .../<artist>/<title>.html -> "title"
function kvSlugFromUrl(u: string) {
  if (!u) return '';
  try {
    const last = new URL(u).pathname.split('/').pop() || '';
    return decodeURIComponent(last.replace(/\.html$/i, '').replace(/[-_]+/g, ' ')).toLowerCase();
  } catch {
    return '';
  }
}

// artist segment from KV url: .../<artist>/<title>.html -> "artist"
function kvArtistFromUrl(u: string) {
  if (!u) return '';
  try {
    const parts = new URL(u).pathname.split('/').filter(Boolean);
    parts.pop(); // remove file
    const artistSeg = parts.pop() || '';
    return decodeURIComponent(artistSeg.replace(/[-_]+/g, ' ')).toLowerCase();
  } catch {
    return '';
  }
}

function titleCase(s: string) {
  return s.replace(/\b[a-z]/g, (m) => m.toUpperCase());
}

function ytThumb(videoId: string, size: 'mq' | 'hq' = 'mq') {
  return size === 'hq'
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// unified URL picker: prefers purchaseUrl/buyUrl, falls back to `url`
function urlOf(t: any): string {
  return String(t?.purchaseUrl || t?.buyUrl || t?.url || "").trim();
}


function JetSpinner({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" stroke="currentColor" className="animate-spin">
      <g fill="none" fillRule="evenodd">
        <g transform="translate(1 1)" strokeWidth="2">
          <circle strokeOpacity=".2" cx="18" cy="18" r="18" />
          <path d="M36 18c0-9.94-8.06-18-18-18">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 18 18"
              to="360 18 18"
              dur="1"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </g>
    </svg>
  );
}

function LastUpdatedNote({ className }: { className?: string }) {
  return (
    <div className={`text-xs text-white/40 dark:text-white/40 ${className}`}>
      Last updated October 29, 2025
    </div>
  );
}

// ---------- legacy data types ----------
type LegacyRecord = {
  artist: string;
  song: string;
  mf_code: string;
  track: string;
};
type LegacyData = {
  count: number;
  records: LegacyRecord[];
};

// ---------- legacy modal ----------
function LegacyDialog({
  open,
  onClose,
  artist,
  title,
  records
}: {
  open: boolean;
  onClose: () => void;
  artist: string;
  title: string;
  records: LegacyRecord[];
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function handleClickOutside(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  // Group records by MF CODE
  const grouped = records.reduce((acc, rec) => {
    if (!acc[rec.mf_code]) acc[rec.mf_code] = [];
    acc[rec.mf_code].push(rec);
    return acc;
  }, {} as Record<string, LegacyRecord[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={dialogRef}
        className="relative max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black dark:text-white">Legacy Disc Codes</h2>
            <p className="text-sm text-black/60 dark:text-white/60">
              {artist} - {title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([mfCode, recs]) => (
              <div key={mfCode} className="rounded-lg border border-black/10 p-3 dark:border-white/10">
                <div className="mb-2 font-medium text-black dark:text-white">{mfCode}</div>
                <div className="text-sm text-black/70 dark:text-white/70">
                  Tracks: {recs.map(r => r.track).join(', ')}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- BuyButton component ---------- */
function BuyButton({ item }: { item: Row }) {
  const url = urlOf(item);
  if (!url) return <span className="text-gray-400">-</span>;

  // determine button color
  let buttonClass = "btn-buy-default";
  if (item.source === 'partytyme') {
    buttonClass = "btn-buy-pt";
  } else if (item.source === 'karaokeversion') {
    buttonClass = "btn-buy-kv";
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-buy ${buttonClass}`}
      aria-label={`Buy ${item.title} by ${item.artist}`}
    >
      View / Buy
    </a>
  );
}

/* ---------- main component ---------- */
export default function Home() {
  const [artistInput, setArtistInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [artistQ, setArtistQ] = useState('');
  const [titleQ, setTitleQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ items: Row[]; total: number }>({ items: [], total: 0 });

  // sorting
  const [sortBy, setSortBy] = useState<'artist' | 'title' | 'brand' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // YouTube
  const [ytHits, setYtHits] = useState<YTHit[]>([]);
  const [ytDebug, setYtDebug] = useState<any[]>([]);
  const [ytLoading, setYtLoading] = useState(false);

  // legacy map: "artist|||title" -> LegacyData
  const [legacyMap, setLegacyMap] = useState<Record<string, LegacyData>>({});
  
  // legacy dialog
  const [legacyDialog, setLegacyDialog] = useState<{
    open: boolean;
    artist: string;
    title: string;
    records: LegacyRecord[];
  }>({ open: false, artist: '', title: '', records: [] });

  // unique key for rows
  function rowKey(t: Row, index: number) {
    // try: id, trackId, combo, fallback
    const parts = [
      t.id,
      t.trackId,
      `${t.artist}-${t.title}-${t.source}`,
      index
    ].filter((v) => v != null);
    return parts[0]?.toString() ?? `row-${index}`;
  }

  /* ---------- Toggle sorting ---------- */
  function toggleSort(field: 'artist' | 'title' | 'brand') {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  }

  /* ---------- fetch logic ---------- */
  async function doSearch() {
    setLoading(true);
    setLegacyMap({});
    try {
      const url = new URL('/api/tracks', window.location.origin);
      if (artistQ) url.searchParams.set('q', artistQ);
      if (titleQ) url.searchParams.set('title', titleQ);
      url.searchParams.set('page', '1');
      url.searchParams.set('pageSize', String(PAGE_SIZE));

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);

      // Build legacy map from response
      if (json.items?.length) {
        const newMap: Record<string, LegacyData> = {};
        json.items.forEach((item: any) => {
          if (item.legacyData) {
            const url = urlOf(item);
            const preferArtist = isKaraokeVersionHost(url) ? kvArtistFromUrl(url) || item.artist : item.artist;
            const preferTitle = isKaraokeVersionHost(url) ? kvSlugFromUrl(url) || item.title : item.title;
            const key = `${norm(preferArtist)}|||${norm(preferTitle)}`;
            newMap[key] = item.legacyData;
          }
        });
        setLegacyMap(newMap);
      }
    } catch {
      setData({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }

  /* ---------- form submit ---------- */
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setArtistQ(artistInput);
    setTitleQ(titleInput);
  }

  /* ---------- effect: search ---------- */
  useEffect(() => {
    const q = artistQ.trim() + ' ' + titleQ.trim();
    if (q.trim()) {
      doSearch();
    } else {
      setData({ items: [], total: 0 });
      setLegacyMap({});
    }
  }, [artistQ, titleQ]);

  /* ---------- effect: sorting ---------- */
  const sortedItems = useMemo(() => {
    if (!sortBy) return data.items;
    const items = [...data.items];
    items.sort((a, b) => {
      let aVal = '', bVal = '';
      if (sortBy === 'artist') {
        aVal = (a.artist ?? '').toLowerCase();
        bVal = (b.artist ?? '').toLowerCase();
      } else if (sortBy === 'title') {
        aVal = (a.title ?? '').toLowerCase();
        bVal = (b.title ?? '').toLowerCase();
      } else if (sortBy === 'brand') {
        aVal = (a.brandDisplay ?? a.brand ?? '').toLowerCase();
        bVal = (b.brandDisplay ?? b.brand ?? '').toLowerCase();
      }
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return items;
  }, [data.items, sortBy, sortDir]);

  useEffect(() => {
    setData((prev) => ({ ...prev, items: sortedItems }));
  }, [sortedItems]);

  /* ---------- effect: YouTube search ---------- */
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!artistQ && !titleQ) {
        setYtHits([]);
        setYtDebug([]);
        return;
      }
      // Require at least one non-empty query and at least one API result
      if ((!artistQ.trim() && !titleQ.trim()) || data.total === 0) {
        setYtHits([]);
        setYtDebug([]);
        return;
      }

      setYtLoading(true);
      try {
        const params = new URLSearchParams();
        if (artistQ) params.set('artist', artistQ);
        if (titleQ) params.set('title', titleQ);

        const res = await fetch(`/api/youtube?${params}`);
        if (!res.ok || cancelled) {
          if (!cancelled) {
            setYtHits([]);
            setYtDebug([]);
          }
          return;
        }
        const { items = [], debug = [] } = await res.json();

        // Split artist + title tokens separately for tighter checks
        const aTokens = norm(artistQ).split(' ').filter(Boolean);
        const tTokens = norm(titleQ).split(' ').filter(Boolean);

        const strict = items.filter((it) => {
          const title = (it.title || '').toLowerCase();
          const label = (it.label || '').toLowerCase();   // e.g. "Party Tyme"
          const handle = (it.handle || '').toLowerCase(); // e.g. "singkingkaraoke"

          // Title requirement: if you typed a title, all title tokens must appear in the video title
          const titleOK = tTokens.length === 0 || tTokens.every((t) => title.includes(t));

          // Artist requirement (only if you typed an artist):
          //   - all artist tokens must appear in the video title, OR
          //   - all artist tokens must appear in the channel label, OR
          //   - all artist tokens must appear in the channel handle
          const artistOK =
            aTokens.length === 0 ||
            aTokens.every((t) => title.includes(t)) ||
            aTokens.every((t) => label.includes(t)) ||
            aTokens.every((t) => handle.includes(t));

          return titleOK && artistOK;
        });

        setYtHits(strict);
        setYtDebug(debug);

      } catch {
        if (!cancelled) {
          setYtHits([]);
          setYtDebug([]);
        }
      } finally {
        if (!cancelled) setYtLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [artistQ, titleQ, data.total]);

  /* ---------- render ---------- */
  return (
    <main className="card relative">
      {/* Header row: Theme toggle only */}
      <div className="mb-4 flex justify-end">
        <ThemeToggle />
      </div>

      {/* Search row: Artist + Title + button */}
      <form onSubmit={onSubmit} className="mb-2 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
        <LastUpdatedNote className="md:col-span-3" />
        <input
          className="input !bg-white !text-black placeholder:text-neutral-500
                     dark:!bg-neutral-900 dark:!text-white dark:placeholder:text-white/40"
          placeholder="Artist (partial OK)"
          value={artistInput}
          onChange={(e) => setArtistInput(e.target.value)}
        />
        <input
          className="input !bg-white !text-black placeholder:text-neutral-500
                     dark:!bg-neutral-900 dark:!text-white dark:placeholder:text-white/40"
          placeholder="Title (partial OK)"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm
                     hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400
                     focus:ring-offset-2 focus:ring-offset-black/10
                     dark:bg-white dark:text-black dark:hover:bg-white/90 dark:focus:ring-white/40"
          aria-label="Search"
        >
          Search
        </button>
      </form>

      {/* Results count */}
      <div className="mb-2 text-sm text-white dark:text-white/70">
        {loading
          ? 'Searching…'
          : `${data.items.length} shown of ${data.total}`}
      </div>

      {/* Zero-results notice */}
      {!loading && (artistQ.trim().length > 0 || titleQ.trim().length > 0) && data.total === 0 && (
        <div className="mb-4 rounded-xl border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-900
                        dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-200">
          No results. Tip: search <b>Artist</b> and/or <b>Title</b>. Partial words are OK.
        </div>
      )}

      {/* Overlay spinner */}
      {loading && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm" role="status">
          <JetSpinner size={48} />
        </div>
      )}

      {/* Results table */}
      <div className="overflow-auto rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900">
        <table className="table">
          <thead>
            <tr>
              <th className="cursor-pointer select-none text-black dark:text-white" onClick={() => toggleSort('artist')}>
                Artist {sortBy === 'artist' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="cursor-pointer select-none text-black dark:text-white" onClick={() => toggleSort('title')}>
                Title {sortBy === 'title' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="cursor-pointer select-none text-black dark:text-white" onClick={() => toggleSort('brand')}>
                Brand {sortBy === 'brand' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="text-black dark:text-white">Legacy</th>
              <th className="text-black dark:text-white">Buy</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((t, i) => (
              <tr
                key={rowKey(t, i)}
                className="border-b border-black/10 odd:bg-black/0 dark:border-white/10 dark:odd:bg-white/5"
              >
                <td className="text-black dark:text-white">
                  {(() => {
                    const url = urlOf(t);
                    if (isKaraokeVersionHost(url)) {
                      const pretty = titleCase(kvArtistFromUrl(url));
                      return pretty || t.artist || '-';
                    }
                    return t.artist || '-';
                  })()}
                </td>
                <td className="text-black dark:text-white">{t.title}</td>
                <td className="text-black dark:text-white">{t.brandDisplay ?? t.brand ?? '-'}</td>

                {/* Legacy cell */}
                <td className="text-black dark:text-white">
                  {(() => {
                    const url = urlOf(t);
                    const preferArtist = isKaraokeVersionHost(url) ? kvArtistFromUrl(url) || t.artist : t.artist;
                    const preferTitle = isKaraokeVersionHost(url) ? kvSlugFromUrl(url) || t.title : t.title;
                    const key = `${norm(preferArtist)}|||${norm(preferTitle)}`;
                    const legacy = legacyMap[key];

                    if (legacy && legacy.count > 0) {
                      return (
                        <button
                          onClick={async () => {
                            // Fetch full legacy data
                            const params = new URLSearchParams({
                              artist: preferArtist,
                              title: preferTitle
                            });
                            const res = await fetch(`/api/legacy?${params}`);
                            if (res.ok) {
                              const data = await res.json();
                              setLegacyDialog({
                                open: true,
                                artist: preferArtist,
                                title: preferTitle,
                                records: data.records || []
                              });
                            }
                          }}
                          className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
                        >
                          Legacy ({legacy.count})
                        </button>
                      );
                    }
                    return '—';
                  })()}
                </td>

                <td className="text-right pr-4">
                  <BuyButton item={t} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* YouTube block */}
      {(artistQ.trim() || titleQ.trim()) && (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-neutral-900">
          <div className="mb-3 text-sm text-black dark:text-white">
            YouTube Official Channels for{' '}
            <span className="font-semibold">
              "{titleQ.trim() || artistQ.trim()}"
            </span>
          </div>

          {ytLoading && (
            <div className="flex items-center gap-3 text-sm text-black dark:text-white/70">
              <JetSpinner size={20} /> Checking YouTube…
            </div>
          )}

          {!ytLoading && ytHits.length > 0 && (
            <ul className="space-y-2">
              {ytHits.map((hit) => (
                <li
                  key={hit.videoId}
                  className="flex flex-col justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 md:flex-row md:items-center"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <img src={ytThumb(hit.videoId, 'mq')} alt={hit.title} className="w-24 rounded-md" />
                    <div>
                      <div className="text-sm font-medium text-black dark:text-white">{hit.label}</div>
                      <div className="truncate text-xs text-black dark:text-white/70">{hit.title}</div>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(hit.url);
                        const el = document.createElement('div');
                        el.textContent = 'Copied!';
                        Object.assign(el.style, {
                          position: 'fixed',
                          bottom: '16px',
                          right: '16px',
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          zIndex: '9999',
                        });
                        document.body.appendChild(el);
                        setTimeout(() => el.remove(), 2000);
                      }}
                      className="rounded-lg bg-black/10 px-3 py-1.5 text-xs font-medium text-black hover:bg-black/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                    >
                      Copy Link
                    </button>
                    <a
                      href={hit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Watch on YouTube
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!ytLoading && ytHits.length === 0 && (
            <div className="text-xs text-black/50 dark:text-white/50">
              No matching videos from official karaoke channels
            </div>
          )}
        </div>
      )}

      {/* Legacy Dialog */}
      <LegacyDialog
        open={legacyDialog.open}
        onClose={() => setLegacyDialog({ open: false, artist: '', title: '', records: [] })}
        artist={legacyDialog.artist}
        title={legacyDialog.title}
        records={legacyDialog.records}
      />
    </main>
  );
}
