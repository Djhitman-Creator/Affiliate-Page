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
              dur="0.9s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </g>
    </svg>
  );
}

function BuyButton({ item }: { item: Row }) {
  const href = urlOf(item);
  if (!href) return null;
  const label = item.brandDisplay ?? item.brand ?? "Store";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View / Buy on ${label}`}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition
                 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400
                 focus:ring-offset-2 focus:ring-offset-black/10
                 dark:bg-emerald-700 dark:hover:bg-emerald-600 dark:focus:ring-offset-white/10"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M3 3h2l.4 2M7 13h6a2 2 0 0 0 1.94-1.5l1.2-4.5A1 1 0 0 0 15.2 6H6.1M7 13l-2 4m2-4l2 4m6-4l-2 4" />
      </svg>
      <span>View / Buy</span>
    </a>
  );
}


// Shows today's date (no time), forced white text both themes
function LastUpdatedNote({ className = "" }: { className?: string }) {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setDateStr(fmt.format(now));
  }, []);

  return (
    <div className={`mb-1 text-xs md:text-sm font-medium !text-white [color:#fff] ${className}`}>
      Last updated{" "}
      <span className="font-semibold !text-white [color:#fff]">
        {dateStr}
      </span>
    </div>
  );
}

/* ---------- Legacy dialog (top-level component) ---------- */
function LegacyDialog({
  open,
  onClose,
  artist,
  title,
  discs
}: {
  open: boolean;
  onClose: () => void;
  artist: string;
  title: string;
  discs: string[];
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl p-5 bg-white text-black dark:bg-neutral-900 dark:text-white shadow-xl">
        <div className="text-lg font-semibold mb-2">
          Legacy discs — {artist} — {title}
        </div>
        <div className="max-h-64 overflow-auto rounded border border-black/10 dark:border-white/10 p-3 text-sm leading-6">
          {discs.length === 0 ? (
            <div className="opacity-70">No legacy discs found.</div>
          ) : (
            <ul className="list-disc pl-5">
              {discs.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className="rounded-xl px-4 py-2 bg-black text-white dark:bg-white dark:text-black"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function Page() {
  // input fields (no debounce)
  const [artistInput, setArtistInput] = useState('');
  const [titleInput, setTitleInput] = useState('');

  // committed search params (set on submit)
  const [artistQ, setArtistQ] = useState('');
  const [titleQ, setTitleQ] = useState('');

  // table state
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'artist' | 'title' | 'brand'>('artist');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ items: Row[]; total: number }>({ items: [], total: 0 });

  // Legacy state
  const [legacyMap, setLegacyMap] = useState<Record<string, { count: number; discs: string[] }>>({});
  const [legacyDialog, setLegacyDialog] = useState<{ open: boolean; artist: string; title: string; discs: string[] }>({ open: false, artist: "", title: "", discs: [] });

  // simple key to trigger fetch sequence order
  const reqId = useRef(0);

  // submit handler: commit inputs → queries, reset page
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setArtistQ(artistInput);
    setTitleQ(titleInput);
    setPage(1);
  }

  // stable row key
  function rowKey(t: Row, idx: number) {
    const parts = [t.source, t.trackId, t.artist, t.title, t.brand].map((v) => v || '').join('|');
    return parts || `row-${idx}`;
  }

  /* ---------- fetch /api/tracks then filter with separate Artist/Title rules ---------- */
  useEffect(() => {
    let cancelled = false;
    const my = ++reqId.current;

    async function run() {
      setLoading(true);

      if (!artistQ.trim() && !titleQ.trim()) {
        if (!cancelled && my === reqId.current) {
          setData({ items: [], total: 0 });
          setLegacyMap({});
          setLoading(false);
        }
        return;
      }

      try {
        // still using your server route; client refines results
        const url = `/api/tracks?q=${encodeURIComponent(
          (artistQ + ' ' + titleQ).trim()
        )}&sortBy=${sortBy}&sortDir=${sortDir}&page=${page}&pageSize=${PAGE_SIZE}`;

        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json();

        if (!cancelled && my === reqId.current) {
          const aTokens = norm(artistQ).split(' ').filter(Boolean);
          const tTokens = norm(titleQ).split(' ').filter(Boolean);

          const every = (hay: string, tokens: string[]) =>
            tokens.every((t) => hay.includes(t));

          const filtered = Array.isArray(json.items)
            ? json.items.filter((it: any) => {
              const url = urlOf(it);
              const isKV = isKaraokeVersionHost(url);

              const A = norm(it.artist);
              const T = norm(it.title);
              const kvA = isKV ? kvArtistFromUrl(url) : '';
              const slug = isKV ? kvSlugFromUrl(url) : '';

              // If a field is empty, treat it as "no constraint" (true).
              // Non-KV: artist field satisfies artist tokens; title field satisfies title tokens.
              const artistPassNonKV = aTokens.length === 0 || every(A, aTokens);
              const titlePassNonKV = tTokens.length === 0 || every(T, tTokens);

              // KV: artist-from-URL satisfies artist tokens;
              //     title OR slug satisfies title tokens.
              const artistPassKV = aTokens.length === 0 || (kvA ? every(kvA, aTokens) : false);
              const titlePassKV =
                tTokens.length === 0 || (every(T, tTokens) || (slug ? every(slug, tTokens) : false));

              return isKV
                ? artistPassKV && titlePassKV
                : artistPassNonKV && titlePassNonKV;
            })
            : [];

          // 1) Deduplicate by canonical URL (fallback: artist|title|brand key)
          const seen = new Set<string>();
          const unique = filtered.filter((it: any) => {
            const url = String(it.purchaseUrl || it.buyUrl || '').trim();
            const key =
              url ||
              `${norm(it.artist)}|${norm(it.title)}|${(it.brandDisplay ?? it.brand ?? '').toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          // 3) Set data
          setData({ items: unique, total: unique.length });

          // 4) Fetch legacy tracks for the current artist/title search
          try {
            const legacyParams = new URLSearchParams();
            if (artistQ) legacyParams.set("artist", artistQ);
            if (titleQ) legacyParams.set("title", titleQ);
            const legacyRes = await fetch(`/api/legacy?${legacyParams.toString()}`);
            const legacyData = await legacyRes.json();

            // Build a quick lookup: key = norm(artist)|||norm(title)
            const legacyLookup: Record<string, { count: number; discs: string[] }> = {};
            (legacyData.items || []).forEach((it: any) => {
              const key = `${norm(it.artist || "")}|||${norm(it.title || "")}`;
              legacyLookup[key] = { count: it.count || 0, discs: it.discs || [] };
            });


            setLegacyMap(legacyLookup);
          } catch (err) {
            console.error("Legacy fetch failed:", err);
            setLegacyMap({});
          }
        }
      } catch {
        if (!cancelled && my === reqId.current) {
          setData({ items: [], total: 0 });
          setLegacyMap({});
        }
      } finally {
        if (!cancelled && my === reqId.current) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [artistQ, titleQ, page, sortBy, sortDir]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE)),
    [data.total]
  );

  function toggleSort(col: 'artist' | 'title' | 'brand') {
    setPage(1);
    if (col === sortBy) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('asc');
    }
  }

  /* ---------- YouTube (use title if provided, else artist) ---------- */
  const [ytLoading, setYtLoading] = useState(false);
  const [ytHits, setYtHits] = useState<YTHit[]>([]);
  const [ytDebug, setYtDebug] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    setYtHits([]);
    setYtDebug([]);

    // Use both fields if available: "artist title"
    const qBase = [artistQ.trim(), titleQ.trim()].filter(Boolean).join(' ');

    if (!qBase) {
      setYtLoading(false);
      return;
    }
    // if there are no rows, still allow YT search using the provided field
    setYtLoading(true);

    async function run() {
      try {
        const res = await fetch(
          `/api/youtube?q=${encodeURIComponent(qBase + ' karaoke')}&debug=1`,
          { cache: 'no-store' }
        );
        const json = await res.json();
        if (cancelled) return;

        const items: YTHit[] = Array.isArray(json?.items) ? json.items : [];
        const debug = Array.isArray(json?.debug) ? json.debug : [];

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
              <th className="text-right text-black dark:text-white pr-4">Buy</th>
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
                          className="rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-500 text-black hover:bg-amber-400"
                          onClick={() =>
                            setLegacyDialog({
                              open: true,
                              artist: t.artist || '',
                              title: t.title || '',
                              discs: legacy.discs || [],
                            })
                          }
                          title={`${legacy.count} legacy disc${legacy.count === 1 ? '' : 's'}`}
                        >
                          Legacy ({legacy.count})
                        </button>
                      );
                    }
                    return <span className="text-xs opacity-60">—</span>;
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
              “{titleQ.trim() || artistQ.trim()}”
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
                          background: 'rgba(0,0,0,0.75)',
                          color: 'white',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          zIndex: '9999',
                        });
                        document.body.appendChild(el);
                        setTimeout(() => el.remove(), 900);
                      }}
                      className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold
                                 shadow-sm border border-black/10 bg-blue-600 text-white
                                 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400
                                 focus:ring-offset-2 focus:ring-offset-black/10 dark:border-white/10"
                    >
                      Copy
                    </button>

                    <a
                      href={hit.url}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold
                                 shadow-sm border border-black/10 bg-[rgb(68,0,1)] text-white
                                 hover:bg-[rgb(68,0,1)]/90 focus:outline-none focus:ring-2 focus:ring-[rgba(68,0,1,0.6)]
                                 focus:ring-offset-2 focus:ring-offset-black/10 dark:border-white/10"
                    >
                      View
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!ytLoading && ytHits.length === 0 && (
            <div className="text-sm text-black dark:text-white/70">No official channel videos found.</div>
          )}

          {ytDebug.length > 0 && (
            <details className="mt-3 text-xs opacity-80">
              <summary>Why?</summary>
              <ul className="mt-2 space-y-1">
                {ytDebug.slice(0, 20).map((d: any, i: number) => (
                  <li key={i}>
                    <span className={d.ok ? 'text-green-400' : 'text-red-400'}>
                      [{d.step}] {d.channel || ''}
                    </span>
                    : {d.ok ? 'ok' : 'failed'}
                    {d.note ? ` — ${String(d.note).slice(0, 180)}` : ''}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="mt-5">
            {(() => {
              const qYT = [artistQ.trim(), titleQ.trim()].filter(Boolean).join(' ');
              const label = qYT || (titleQ || artistQ);
              return (
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent((qYT || '').trim() + ' karaoke')}`}
                  target="_blank"
                  rel="noopener"
                  className="block w-full rounded-xl bg-[rgb(68,0,1)] px-4 py-3 text-center text-sm font-semibold text-white
                 hover:bg-[rgb(68,0,1)]/90 focus:outline-none focus:ring-2 focus:ring-[rgba(68,0,1,0.6)]
                 focus:ring-offset-2 focus:ring-offset-black/10 dark:focus:ring-offset-white/10"
                >
                  General Results for “{label}” on YouTube
                </a>
              );
            })()}
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-5 flex items-center justify-between">
        <button
          className="btn !bg-white !text-black dark:!bg-neutral-900 dark:!text-white"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <div className="text-sm text-white dark:text-white/70">
          Page {page} / {totalPages}
        </div>
        <button
          className="btn !bg-white !text-black dark:!bg-neutral-900 dark:!text-white"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>

      {/* ✅ Mount the Legacy dialog once */}
      <LegacyDialog
        open={legacyDialog.open}
        onClose={() => setLegacyDialog({ open: false, artist: "", title: "", discs: [] })}
        artist={legacyDialog.artist}
        title={legacyDialog.title}
        discs={legacyDialog.discs}
      />
    </main>
  );
}

