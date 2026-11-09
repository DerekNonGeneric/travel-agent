'use client';

import { motion } from 'motion/react';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cx, Logo, Spinner, ThemeToggle } from './ui';

const destinations = [
  { name: 'San Salvador', x: '8%', y: '62%', delay: 0 },
  { name: 'Kyoto', x: '64%', y: '38%', delay: 0.4 },
  { name: 'Cartagena', x: '30%', y: '86%', delay: 0.8 },
  { name: 'Lisbon', x: '72%', y: '76%', delay: 1.2 },
  { name: 'Cancún', x: '36%', y: '46%', delay: 1.6 },
];

// Lucide "plane" glyph (24×24, nose pointing up-right).
const PLANE_PATH =
  'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z';

function RouteArt() {
  return (
    <div className="relative h-full min-h-[300px] overflow-hidden rounded-[28px] bg-ink text-paper">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(32rem 22rem at 20% 10%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 70%), radial-gradient(30rem 20rem at 90% 90%, color-mix(in oklab, var(--sea) 60%, transparent), transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '18px 18px',
        }}
      />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <path
          id="route"
          d="M70 300 C 140 150, 250 120, 335 205"
          fill="none"
          stroke="white"
          strokeOpacity="0.55"
          strokeWidth="1.6"
          strokeDasharray="5 7"
        />
        <circle cx="70" cy="300" r="5" fill="white" />
        <circle cx="70" cy="300" r="11" fill="white" fillOpacity="0.15">
          <animate attributeName="r" values="6;16;6" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="fill-opacity" values="0.3;0;0.3" dur="2.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="335" cy="205" r="5" fill="var(--accent)" />
        <g>
          <g transform="rotate(45) scale(0.9) translate(-12 -12)">
            <path d={PLANE_PATH} fill="white" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
          </g>
          <animateMotion dur="7s" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.55 1">
            <mpath href="#route" />
          </animateMotion>
        </g>
      </svg>

      {destinations.map((d) => (
        <motion.span
          key={d.name}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: [0, -6, 0] }}
          transition={{
            opacity: { delay: d.delay, duration: 0.6 },
            y: { delay: d.delay, duration: 5, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md"
          style={{ left: d.x, top: d.y }}
        >
          {d.name}
        </motion.span>
      ))}

      <div className="absolute inset-x-0 top-0 p-7 sm:p-9">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">Boarding now</p>
        <p className="mt-2 max-w-sm font-display text-3xl font-medium leading-tight sm:text-[2.1rem]">
          Plan your next trip in one conversation.
        </p>
      </div>
    </div>
  );
}

export function Gate() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!name.trim()) return setError('Please enter your first name.');
    if (!code.trim()) return setError('Please enter the access code you were given.');
    if (!consent) return setError('Please confirm the note about recorded conversations.');
    setLoading(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  const field =
    'w-full rounded-xl border border-line bg-card px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink-3 focus:border-ink-3 focus:ring-4 focus:ring-accent/15';

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className="backdrop pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-5 sm:px-6">
        <header className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </header>

        <div className="grid flex-1 items-center gap-6 py-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:py-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="order-2 hidden h-[420px] sm:block lg:order-1 lg:h-[560px]"
          >
            <RouteArt />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
            className="order-1 lg:order-2"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1 text-xs font-medium text-ink-2 backdrop-blur">
              <span className="size-1.5 rounded-full bg-good" /> Private test preview
            </p>
            <h1 className="mt-4 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Hello, traveler <span className="inline-block origin-[70%_70%] animate-[wave_2.4s_ease-in-out_1]">👋</span>
            </h1>
            <p className="mt-3 max-w-md text-[17px] leading-relaxed text-ink-2">
              Thanks for helping us test <strong className="font-semibold text-ink">TravelMate AI</strong> — a travel
              assistant that helps you find flights, plan itineraries, and estimate costs.
            </p>

            <form onSubmit={submit} className="mt-7 max-w-md space-y-3.5" noValidate>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-2">Your first name</span>
                <input
                  className={field}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ana"
                  autoComplete="given-name"
                  maxLength={40}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-2">Access code</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
                  <input
                    className={cx(field, 'pl-10 font-mono tracking-wider')}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Code from the invite"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-card/60 p-3.5 text-sm leading-relaxed text-ink-2">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                />
                <span>
                  I understand my conversation will be <strong className="font-medium text-ink">saved for a class project</strong>{' '}
                  and I won&apos;t share personal details like passport or card numbers.
                </span>
              </label>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="rounded-lg bg-accent-soft px-3.5 py-2.5 text-sm font-medium text-accent-ink"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-[15px] font-semibold text-paper shadow-soft transition hover:-translate-y-px hover:shadow-float active:translate-y-0 disabled:opacity-70"
              >
                {loading ? <Spinner /> : null}
                {loading ? 'Checking in…' : 'Start planning'}
                {!loading && <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />}
              </button>

              <p className="flex items-center gap-1.5 pt-1 text-xs text-ink-3">
                <ShieldCheck className="size-3.5" /> TravelMate is an AI assistant. Prices and travel rules are estimates.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
