"use client";

// Identical to the main karatrack.com ThemeToggle for a seamless look.
// The chosen theme is also written to a cookie shared across
// *.karatrack.com, so picking dark mode here carries over to the main
// site (and vice versa) - see lib/cross-site-prefs.ts.
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  THEME_COOKIE,
  readPrefCookie,
  writeSharedPrefCookie,
} from "@/lib/cross-site-prefs";

const THEMES = ["light", "dark", "system"] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Adopt the theme chosen on any *.karatrack.com site.
  // - On load: follow the shared cookie; if none exists yet (visitor chose a
  //   theme BEFORE cross-site sync shipped), seed the cookie from this
  //   site's saved choice so existing preferences start syncing too.
  // - On tab focus/visibility: re-check, so a tab that was already open
  //   catches a change made on the other site without needing a refresh.
  useEffect(() => {
    const apply = () => {
      const shared = readPrefCookie(THEME_COOKIE);
      if (shared && (THEMES as readonly string[]).includes(shared)) {
        setTheme(shared);
      } else if (!shared) {
        try {
          const current = localStorage.getItem("theme");
          if (current && (THEMES as readonly string[]).includes(current)) {
            writeSharedPrefCookie(THEME_COOKIE, current);
          }
        } catch {
          // localStorage unavailable (private mode etc.) - nothing to seed.
        }
      }
    };
    apply();
    const onVisible = () => {
      if (document.visibilityState === "visible") apply();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    setMounted(true);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(next: (typeof THEMES)[number]) {
    setTheme(next);
    writeSharedPrefCookie(THEME_COOKIE, next);
  }

  if (!mounted) {
    return <div className="h-10 w-28 rounded-full border border-slate-200 dark:border-slate-800" />;
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <button aria-label="Light mode" onClick={() => choose("light")} className={`rounded-full p-2 ${theme === "light" ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
        <Sun className="h-4 w-4" />
      </button>
      <button aria-label="Dark mode" onClick={() => choose("dark")} className={`rounded-full p-2 ${theme === "dark" ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
        <Moon className="h-4 w-4" />
      </button>
      <button aria-label="System mode" onClick={() => choose("system")} className={`rounded-full p-2 ${theme === "system" ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}

export default ThemeToggle;
