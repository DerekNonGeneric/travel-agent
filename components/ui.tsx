'use client';

import { Moon, Plane, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export function Logo({ compact = false, responsive = false }: { compact?: boolean; responsive?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <span className="relative grid size-9 place-items-center rounded-xl bg-ink text-paper shadow-soft">
        <Plane className="size-[18px] -rotate-45" strokeWidth={2.2} />
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-accent ring-2 ring-paper" />
      </span>
      {!compact && (
        <span
          className={cx(
            'whitespace-nowrap font-display text-[1.35rem] font-semibold leading-none tracking-tight',
            responsive && 'hidden sm:inline',
          )}
        >
          TravelMate<span className="text-accent"> AI</span>
        </span>
      )}
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('tm-theme', next ? 'dark' : 'light');
    } catch {}
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cx(
        'grid size-9 place-items-center rounded-full text-ink-2 transition hover:bg-paper-2 hover:text-ink',
        className,
      )}
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx('inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent', className)}
    />
  );
}
