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

  // On first load, adopt the theme chosen on any *.karatrack.com site.
  // Runs once; afterwards the local choice is the live one.
  useEffect(() => {
    const shared = readPrefCookie(THEME_COOKIE);
    if (shared && (THEMES as readonly string[]).includes(shared)) {
      setTheme(shared);
    }
    setMounted(true);
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
