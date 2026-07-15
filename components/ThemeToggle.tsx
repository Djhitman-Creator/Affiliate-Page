"use client";

// Identical to the main karatrack.com ThemeToggle for a seamless look.
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-10 w-28 rounded-full border border-slate-200 dark:border-slate-800" />;
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <button aria-label="Light mode" onClick={() => setTheme("light")} className={`rounded-full p-2 ${theme === "light" ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
        <Sun className="h-4 w-4" />
      </button>
      <button aria-label="Dark mode" onClick={() => setTheme("dark")} className={`rounded-full p-2 ${theme === "dark" ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
        <Moon className="h-4 w-4" />
      </button>
      <button aria-label="System mode" onClick={() => setTheme("system")} className={`rounded-full p-2 ${theme === "system" ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}

export default ThemeToggle;
