'use client';

import React, { useEffect, useMemo, useRef, useState, } from 'react';
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

/* ---------- Search Loading Overlay (moved outside) ---------- */
function SearchLoadingOverlay({ isSearching, searchProgress }: { isSearching: boolean; searchProgress: string }) {
  if (!isSearching) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4 min-w-[250px]">
        {/* Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin border-t-blue-500 dark:border-t-blue-400"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Searching for tracks...
          </p>
          {searchProgress && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {searchProgress}
            </p>
          )}
        </div>

        {/* Animated dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Legacy Dialog Component (moved outside) ---------- */
interface LegacyDialogProps {
  open: boolean;
  onClose: () => void;
  artist: string;
  title: string;
  discs: string[];
  buttonRect?: DOMRect;
}

function LegacyDialog({ open, onClose, artist, title, discs, buttonRect }: LegacyDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && buttonRect) {
      // Calculate position next to the button
      let posX = buttonRect.left + buttonRect.width + 10; // 10px to the right
      let posY = buttonRect.top + window.scrollY; // Align with button top

      // Estimate dialog dimensions
      const dialogWidth = 400;
      const dialogHeight = 350;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // If dialog would go off right edge, show it on the left side of button
      if (posX + dialogWidth > viewportWidth - 20) {
        posX = buttonRect.left - dialogWidth - 10;
      }

      // If dialog would go off bottom, adjust upward
      if (posY + dialogHeight > window.scrollY + viewportHeight - 20) {
        posY = Math.max(window.scrollY + 20, window.scrollY + viewportHeight - dialogHeight - 20);
      }

      // Ensure minimum distance from edges
      if (posX < 20) posX = 20;
      if (posY < window.scrollY + 20) posY = window.scrollY + 20;

      setPosition({ top: posY, left: posX });
    }
  }, [open, buttonRect]);

  if (!open) return null;

  // If we have button position, use absolute positioning
  if (buttonRect) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

        {/* Dialog positioned next to button */}
        <div
          ref={dialogRef}
          className="absolute z-50 w-full max-w-lg rounded-2xl p-5 bg-white text-black dark:bg-neutral-900 dark:text-white shadow-xl"
          style={{
            position: 'absolute',
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: '400px'
          }}
        >
          <div className="text-lg font-semibold mb-2">
            Legacy discs — {artist} — {title}
          </div>
          <div className="max-h-64 overflow-auto rounded border border-black/10 dark:border-white/10 p-3 text-sm leading-6">
            {discs.length === 0 ? (
              <div className="opacity-70">No legacy discs found.</div>
            ) : (
              <ul className="list-disc pl-5">
                {discs.map((d: string, i: number) => <li key={i}>{d}</li>)}
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
      </>
    );
  }

  // Fallback to original centered version if no button position
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
              {discs.map((d: string, i: number) => <li key={i}>{d}</li>)}
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

/* ---------- Admin Section Component (moved outside) ---------- */
interface AdminSectionProps {
  isUnlocked: boolean;
  setIsUnlocked: (value: boolean) => void;
}

function AdminSection({ isUnlocked, setIsUnlocked }: AdminSectionProps) {
  const [password, setPassword] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Powder01!') {
      setIsUnlocked(true);
      setPassword('');
    } else {
      alert('Incorrect password');
      setPassword('');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="mt-12 border-t border-white/10 pt-6">
        <form onSubmit={handleUnlock} className="flex items-center gap-2">
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg bg-white/10 px-3 py-1 text-sm text-white placeholder:text-white/40 focus:bg-white/20 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-white/10 px-4 py-1 text-sm text-white hover:bg-white/20">
            Unlock Admin
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t border-white/10 pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">Admin Controls</h3>
        <button onClick={() => setIsUnlocked(false)} className="text-xs text-white/40 hover:text-white/60">
          Lock
        </button>
      </div>

      {/* Signup Downloads Section */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <h4 className="font-semibold mb-3 text-white">Newsletter Signups</h4>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/signup?format=csv');
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `signups_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              } catch (error) {
                console.error('Download error:', error);
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Download CSV
          </button>

          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/signup?format=json');
                const data = await response.json();
                alert(`Total signups: ${data.count || 0}`);
              } catch (error) {
                console.error('Count error:', error);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Count
          </button>
        </div>
      </div>

      {/* Original Admin Links */}
      <div className="mt-4 flex flex-wrap gap-2">
        <a href="/admin" className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
          Admin Panel
        </a>
        <a href="https://karaokehouston.com" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
          Karaoke Houston
        </a>
        <button onClick={() => window.location.href = '/api/admin/track-count'} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
          Track Count
        </button>
        <button onClick={() => window.location.href = '/api/admin/check-db'} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
          Check DB
        </button>
      </div>
    </div>
  );
}

/* ---------- Signup Modal Component (FIXED VERSION) ---------- */
interface SignupModalProps {
  showSignupModal: boolean;
  setShowSignupModal: (value: boolean) => void;
  signupName: string;
  setSignupName: (value: string) => void;
  signupEmail: string;
  setSignupEmail: (value: string) => void;
  signupPhone: string;
  setSignupPhone: (value: string) => void;
  signupSubmitting: boolean;
  setSignupSubmitting: (value: boolean) => void;
  signupSuccess: boolean;
  setSignupSuccess: (value: boolean) => void;
}

function SignupModal({
  showSignupModal,
  setShowSignupModal,
  signupName,
  setSignupName,
  signupEmail,
  setSignupEmail,
  signupPhone,
  setSignupPhone,
  signupSubmitting,
  setSignupSubmitting,
  signupSuccess,
  setSignupSuccess
}: SignupModalProps) {
  if (!showSignupModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupSubmitting(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          phone: signupPhone,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setSignupSuccess(true);
        // Keep modal open longer to show success message
        setTimeout(() => {
          setShowSignupModal(false);
          setSignupSuccess(false);
          setSignupName('');
          setSignupEmail('');
          setSignupPhone('');
        }, 3000); // Increased from 2000 to 3000ms
      } else {
        // Handle error
        alert('There was an error submitting your signup. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('There was an error submitting your signup. Please try again.');
    } finally {
      setSignupSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🎉 Be First to Know!
          </h2>
          <button
            onClick={() => setShowSignupModal(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {signupSuccess ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-6xl mb-4 animate-bounce">✓</div>
            <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Thank you for signing up!
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              We'll notify you first when the big news drops!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
              This window will close automatically...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white 
                         placeholder-gray-400 dark:placeholder-gray-500
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="John Doe"
                disabled={signupSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white 
                         placeholder-gray-400 dark:placeholder-gray-500
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="john@example.com"
                disabled={signupSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white 
                         placeholder-gray-400 dark:placeholder-gray-500
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="555-123-4567"
                disabled={signupSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={signupSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 
                       rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed
                       flex items-center justify-center"
            >
              {signupSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Sign Me Up!'
              )}
            </button>
          </form>
        )}
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
  const [legacyDialog, setLegacyDialog] = useState<{
    open: boolean;
    artist: string;
    title: string;
    discs: string[];
    buttonRect?: DOMRect
  }>({
    open: false,
    artist: "",
    title: "",
    discs: [],
    buttonRect: undefined
  });

  // Loading states for search
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState('');

  // Checkbox state for legacy search
  const [searchLegacy, setSearchLegacy] = useState(false);

  // Signup modal states
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // YouTube state
  const [ytLoading, setYtLoading] = useState(false);
  const [ytHits, setYtHits] = useState<YTHit[]>([]);
  const [ytDebug, setYtDebug] = useState<any[]>([]);

  // Admin state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // simple key to trigger fetch sequence order
  const reqId = useRef(0);

  // submit handler: commit inputs → queries, reset page
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('FORM SUBMITTED - Artist:', artistInput, 'Title:', titleInput);
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
      console.log('SEARCH RUNNING - artistQ:', artistQ, 'titleQ:', titleQ);
      setLoading(true);

      console.log('Search running - artist:', artistQ, 'title:', titleQ);
      setIsSearching(true);
      setSearchProgress('Initializing search...');

      if (!artistQ.trim() && !titleQ.trim()) {
        if (!cancelled && my === reqId.current) {
          setData({ items: [], total: 0 });
          setLegacyMap({});
          setLoading(false);
          setIsSearching(false);
          setSearchProgress('');
        }
        return;
      }

      try {
        setSearchProgress('Searching Party Tyme, Karaoke Version, and YouTube...');
        // still using your server route; client refines results
        const url = `/api/tracks?q=${encodeURIComponent(
          (artistQ + ' ' + titleQ).trim()
        )}&sortBy=${sortBy}&sortDir=${sortDir}&page=${page}&pageSize=${PAGE_SIZE}`;

        console.log('Fetching URL:', url);
        const res = await fetch(url, { cache: 'no-store' });
        console.log('Response status:', res.status);

        setSearchProgress('Processing search results...');
        const json = await res.json();
        console.log('Response data:', json);

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
          console.log('Setting data with', unique.length, 'items');
          setData({ items: unique, total: unique.length });
          console.log('Data set complete');

          // 4) Fetch legacy tracks for the current artist/title search (if enabled)
          console.log('Legacy checkbox state:', searchLegacy);
          if (searchLegacy) {
            console.log('Legacy search RUNNING because checkbox is checked');
            try {
              setSearchProgress('Checking legacy disc database...');

              // Get unique artist/title combinations from results
              const uniqueTracks = new Map();
              json.items.forEach((item: any) => {
                const key = `${norm(item.artist || "")}|||${norm(item.title || "")}`;
                if (!uniqueTracks.has(key)) {
                  uniqueTracks.set(key, { artist: item.artist, title: item.title });
                }
              });

              // Fetch legacy data for each unique track
              const legacyLookup: Record<string, { count: number; discs: string[] }> = {};
              for (const [key, track] of uniqueTracks.entries()) {
                const params = new URLSearchParams({
                  artist: track.artist || "",
                  title: track.title || ""
                });

                try {
                  const res = await fetch(`/api/legacy?${params.toString()}`);
                  const data = await res.json();
                  if (data.items && data.items.length > 0) {
                    // Sum up all matching items (handles title variations)
                    const totalCount = data.items.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
                    const allDiscs = data.items.flatMap((item: any) => item.discs || []);

                    legacyLookup[key] = {
                      count: totalCount,
                      discs: allDiscs
                    };
                  }
                } catch (error) {
                  console.error("Legacy fetch error:", error);
                }
              }

              setLegacyMap(legacyLookup);
            } catch (err) {
              console.error("Legacy fetch failed:", err);
              setLegacyMap({});
            }
          } else {
            // If not searching legacy, clear the legacy map
            setLegacyMap({});
          }
        }
      } catch {
        if (!cancelled && my === reqId.current) {
          setData({ items: [], total: 0 });
          setLegacyMap({});
        }
      } finally {
        if (!cancelled && my === reqId.current) {
          setLoading(false);
          setIsSearching(false);
          setSearchProgress('');
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [artistQ, titleQ, page, sortBy, sortDir, searchLegacy]);

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
    <>
      {/* Loading overlay outside main */}
      <SearchLoadingOverlay isSearching={isSearching} searchProgress={searchProgress} />

      <main className="card relative">

        {/* Big News Banner - Bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg border-t border-purple-700">
          <button
            onClick={() => setShowSignupModal(true)}
            className="w-full px-4 py-3 text-white hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="animate-pulse">🎉</span>
              <span className="font-bold text-lg">Big News Coming Soon! Sign up to be notified first!</span>
              <span className="animate-pulse">🎉</span>
            </div>
          </button>
        </div>

        {/* Main content */}
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>

        { }
        <form onSubmit={onSubmit} className="mb-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
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
          </div>

          {/* Legacy search checkbox - prettier version */}
          <div className="mt-3 flex items-center">
            <input
              type="checkbox"
              id="searchLegacy"
              checked={searchLegacy}
              onChange={(e) => setSearchLegacy(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500
               dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-purple-400"
            />
            <label
              htmlFor="searchLegacy"
              className="ml-2 text-sm text-white dark:text-gray-300 cursor-pointer select-none flex items-center"
            >
              <span className="mr-1">💿</span>
              Search legacy disc database
              <span className="ml-1 text-xs text-white/70 dark:text-gray-400">(slower)</span>
            </label>
          </div>
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
                <th className="text-black dark:text-white pr-4">Buy</th>
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
                            onClick={(e) => {
                              const buttonRect = e.currentTarget.getBoundingClientRect();
                              setLegacyDialog({
                                open: true,
                                artist: t.artist || '',
                                title: t.title || '',
                                discs: legacy.discs || [],
                                buttonRect: buttonRect
                              });
                            }}
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
                    General Results for "{label}" on YouTube
                  </a>
                );
              })()}
            </div>
          </div>
        )}

        {/* Admin Section - Now using props */}
        <AdminSection isUnlocked={isAdminUnlocked} setIsUnlocked={setIsAdminUnlocked} />

        {/* Spacer to push content above banner */}
        <div className="h-32"></div>

        {/* Main content ends here */}
      </main>

      {/* ✅ Mount the Legacy dialog once - also outside main */}
      <LegacyDialog
        open={legacyDialog.open}
        onClose={() => setLegacyDialog({ open: false, artist: "", title: "", discs: [], buttonRect: undefined })}
        artist={legacyDialog.artist}
        title={legacyDialog.title}
        discs={legacyDialog.discs}
        buttonRect={legacyDialog.buttonRect}
      />

      {/* Signup Modal - Now using props */}
      <SignupModal
        showSignupModal={showSignupModal}
        setShowSignupModal={setShowSignupModal}
        signupName={signupName}
        setSignupName={setSignupName}
        signupEmail={signupEmail}
        setSignupEmail={setSignupEmail}
        signupPhone={signupPhone}
        setSignupPhone={setSignupPhone}
        signupSubmitting={signupSubmitting}
        setSignupSubmitting={setSignupSubmitting}
        signupSuccess={signupSuccess}
        setSignupSuccess={setSignupSuccess}
      />
    </>
  );
}
