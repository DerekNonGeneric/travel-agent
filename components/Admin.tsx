'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Download, Lock, LogOut, ThumbsDown, ThumbsUp, Trash, TriangleAlert, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { TravelIntent } from '../intents';
import { intentMeta } from '../lib/intent-meta';
import type { Session, Turn } from '../lib/types';
import { IntentChip } from './Insights';
import { cx, Logo, Spinner, ThemeToggle } from './ui';

/* ---------------- Login ---------------- */

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (res.ok) router.refresh();
    else {
      setError((await res.json().catch(() => ({}))).error || 'Incorrect code.');
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[24px] border border-line bg-card p-7 shadow-float">
        <Logo />
        <h1 className="mt-6 font-display text-2xl font-semibold">Test results</h1>
        <p className="mt-1 text-sm text-ink-2">For the project team only.</p>
        {!configured && (
          <p className="mt-4 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-ink">
            Set the ADMIN_CODE environment variable to enable this page.
          </p>
        )}
        <div className="relative mt-5">
          <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Admin code"
            className="w-full rounded-xl border border-line bg-paper py-3 pl-10 pr-4 font-mono outline-none focus:border-ink-3 focus:ring-4 focus:ring-accent/15"
          />
        </div>
        {error && <p className="mt-3 text-sm font-medium text-accent-ink">{error}</p>}
        <button
          disabled={loading || !configured}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 font-semibold text-paper disabled:opacity-60"
        >
          {loading && <Spinner />} View results
        </button>
      </form>
    </main>
  );
}

/* ---------------- Dashboard ---------------- */

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-soft">
      <p className="text-[13px] text-ink-2">{label}</p>
      <p className="mt-1.5 text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-ink-3">{sub}</p>}
    </div>
  );
}

const pct = (n: number, d: number) => (d === 0 ? '—' : `${Math.round((n / d) * 100)}%`);

export function AdminDashboard({ sessions: initial, persistent }: { sessions: Session[]; persistent: boolean }) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [showEmpty, setShowEmpty] = useState(false);

  const active = sessions.filter((s) => s.turns.length > 0 || s.survey);
  const visible = showEmpty ? sessions : active;

  const stats = useMemo(() => {
    const turns = active.flatMap((s) => s.turns);
    const reviewed = turns.filter((t) => t.intentCorrect !== undefined);
    const correct = reviewed.filter((t) => t.intentCorrect).length;
    const up = turns.filter((t) => t.feedback === 'up').length;
    const down = turns.filter((t) => t.feedback === 'down').length;
    const surveys = active.map((s) => s.survey).filter((s) => !!s);
    const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '—');
    const counts = new Map<TravelIntent, number>();
    for (const t of turns) counts.set(t.intent, (counts.get(t.intent) ?? 0) + 1);
    const breakdown = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const spanish = turns.filter((t) => t.language === 'es').length;
    const avgMs = turns.length ? turns.reduce((a, t) => a + t.classifyMs, 0) / turns.length : 0;
    return {
      turns: turns.length,
      reviewed: reviewed.length,
      correct,
      up,
      down,
      surveys,
      overall: avg(surveys.map((s) => s.overall)),
      ease: avg(surveys.map((s) => s.easeOfUse)),
      remembered: surveys.filter((s) => s.rememberedContext === 'yes').length,
      breakdown,
      intentsCovered: counts.size,
      spanish,
      avgMs,
    };
  }, [active]);

  function patchTurn(sessionId: string, turnId: string, intentCorrect: boolean | null) {
    setSessions((ss) =>
      ss.map((s) =>
        s.id !== sessionId
          ? s
          : {
              ...s,
              turns: s.turns.map((t) => {
                if (t.id !== turnId) return t;
                const next = { ...t };
                if (intentCorrect === null) delete next.intentCorrect;
                else next.intentCorrect = intentCorrect;
                return next;
              }),
            },
      ),
    );
    fetch('/api/admin/turn', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, turnId, intentCorrect }),
    });
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this session permanently?')) return;
    await fetch(`/api/admin/sessions?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setSessions((ss) => ss.filter((s) => s.id !== id));
  }

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.refresh();
  }

  const maxCount = stats.breakdown[0]?.[1] ?? 1;

  return (
    <main className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden rounded-full bg-paper-2 px-2.5 py-1 text-xs font-medium text-ink-2 sm:inline">
              Test results
            </span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="/api/admin/export?format=csv"
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-2 hover:bg-paper-2 hover:text-ink"
            >
              <Download className="size-4" /> CSV
            </a>
            <a
              href="/api/admin/export?format=json"
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-2 hover:bg-paper-2 hover:text-ink"
            >
              <Download className="size-4" /> JSON
            </a>
            <ThemeToggle />
            <button
              onClick={logout}
              aria-label="Sign out"
              className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-paper-2"
            >
              <LogOut className="size-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {!persistent && (
          <p className="flex items-start gap-2.5 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-ink">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong>Storage is in-memory.</strong> Results will be lost when the server restarts. Connect an Upstash
              Redis database in Vercel before testing.
            </span>
          </p>
        )}

        <section>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Phase 4 · Testing & evaluation</h1>
          <p className="mt-1 text-ink-2">
            Review each detected intent below (✓ / ✗) to measure intent-recognition accuracy.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Stat label="Testers" value={String(active.length)} sub={`${stats.surveys.length} completed survey`} />
            <Stat label="Messages" value={String(stats.turns)} sub={`${stats.spanish} in Spanish`} />
            <Stat
              label="Intent accuracy"
              value={pct(stats.correct, stats.reviewed)}
              sub={`${stats.correct} of ${stats.reviewed} reviewed`}
            />
            <Stat label="Helpful replies" value={pct(stats.up, stats.up + stats.down)} sub={`${stats.up} 👍 · ${stats.down} 👎`} />
            <Stat label="Average rating" value={stats.overall === '—' ? '—' : `${stats.overall}/5`} sub={`Ease of use ${stats.ease}/5`} />
            <Stat
              label="Remembered context"
              value={pct(stats.remembered, stats.surveys.length)}
              sub={`Avg. classify ${(stats.avgMs / 1000).toFixed(1)}s`}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-[22px] border border-line bg-card p-5 shadow-soft">
            <h2 className="font-semibold">Messages by detected intent</h2>
            <p className="text-sm text-ink-3">{stats.intentsCovered} of 14 intents seen</p>
            {stats.breakdown.length === 0 ? (
              <p className="mt-6 text-sm text-ink-3">No messages yet.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {stats.breakdown.map(([intent, count]) => (
                  <li
                    key={intent}
                    className="group grid grid-cols-[9.5rem_1fr] items-center gap-3"
                    title={`${intentMeta[intent].label}: ${count} message${count === 1 ? '' : 's'}`}
                  >
                    <span className="truncate text-[13px] text-ink-2">{intentMeta[intent].label}</span>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-4 rounded-r-[4px] bg-sea transition group-hover:brightness-110"
                        style={{ width: `${Math.max((count / maxCount) * 100, 3)}%` }}
                      />
                      <span className="text-xs font-medium tabular-nums text-ink">{count}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-hidden rounded-[22px] border border-line bg-card shadow-soft">
            <div className="p-5 pb-3">
              <h2 className="font-semibold">Results summary</h2>
              <p className="text-sm text-ink-3">Ready for your report&apos;s evaluation table.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-y border-line bg-paper-2/60 text-left text-xs text-ink-2">
                    <th className="px-5 py-2 font-medium">Tester</th>
                    <th className="px-3 py-2 font-medium">Intents tested</th>
                    <th className="px-3 py-2 font-medium">Accuracy</th>
                    <th className="px-5 py-2 font-medium">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {active.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-ink-3">
                        No testers yet.
                      </td>
                    </tr>
                  )}
                  {active.map((s) => {
                    const intents = [...new Set(s.turns.map((t) => intentMeta[t.intent].label))];
                    const reviewed = s.turns.filter((t) => t.intentCorrect !== undefined);
                    const ok = reviewed.filter((t) => t.intentCorrect).length;
                    return (
                      <tr key={s.id} className="border-b border-line last:border-0 align-top">
                        <td className="px-5 py-3 font-medium capitalize">{s.name}</td>
                        <td className="px-3 py-3 text-ink-2">{intents.join(', ') || '—'}</td>
                        <td className="px-3 py-3 tabular-nums">
                          {reviewed.length ? `${ok}/${reviewed.length}` : <span className="text-ink-3">Pending</span>}
                        </td>
                        <td className="px-5 py-3 text-ink-2">
                          {s.survey ? (
                            <>
                              <span className="font-medium text-ink">{'★'.repeat(s.survey.overall)}</span>
                              <span className="text-ink-3">{'★'.repeat(5 - s.survey.overall)}</span>
                              {s.survey.comment && <span className="mt-1 block">&ldquo;{s.survey.comment}&rdquo;</span>}
                            </>
                          ) : (
                            <span className="text-ink-3">No survey</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Conversations</h2>
            {sessions.length !== active.length && (
              <label className="flex items-center gap-2 text-sm text-ink-2">
                <input type="checkbox" checked={showEmpty} onChange={(e) => setShowEmpty(e.target.checked)} />
                Show empty sessions ({sessions.length - active.length})
              </label>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {visible.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                open={open === s.id}
                onToggle={() => setOpen(open === s.id ? null : s.id)}
                onReview={(turnId, v) => patchTurn(s.id, turnId, v)}
                onDelete={() => remove(s.id)}
              />
            ))}
            {visible.length === 0 && (
              <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-3">
                Conversations will appear here once testers start chatting.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SessionRow({
  session: s,
  open,
  onToggle,
  onReview,
  onDelete,
}: {
  session: Session;
  open: boolean;
  onToggle: () => void;
  onReview: (turnId: string, v: boolean | null) => void;
  onDelete: () => void;
}) {
  const reviewed = s.turns.filter((t) => t.intentCorrect !== undefined).length;
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-card shadow-soft">
      <button onClick={onToggle} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-paper-2/40">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink font-semibold uppercase text-paper">
          {s.name.slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold capitalize">{s.name}</span>
          <span className="block text-xs text-ink-3">
            {new Date(s.createdAt).toLocaleString()} · {s.turns.length} messages · {reviewed}/{s.turns.length} reviewed
            {s.survey ? ' · survey ✓' : ''}
          </span>
        </span>
        <ChevronDown className={cx('size-5 shrink-0 text-ink-3 transition', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-line bg-paper-2/30 p-4 sm:p-5">
              {s.survey && (
                <div className="rounded-2xl border border-line bg-card p-4 text-sm">
                  <p className="font-semibold">Survey</p>
                  <p className="mt-1 text-ink-2">
                    Overall {s.survey.overall}/5 · Ease of use {s.survey.easeOfUse}/5 · Remembered context:{' '}
                    {s.survey.rememberedContext}
                  </p>
                  {s.survey.comment && <p className="mt-2 text-ink">&ldquo;{s.survey.comment}&rdquo;</p>}
                </div>
              )}
              {s.turns.map((t, i) => (
                <TurnCard key={t.id} index={i + 1} turn={t} onReview={(v) => onReview(t.id, v)} />
              ))}
              <div className="flex justify-end">
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-bad hover:bg-bad/10"
                >
                  <Trash className="size-4" /> Delete session
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TurnCard({ turn: t, index, onReview }: { turn: Turn; index: number; onReview: (v: boolean | null) => void }) {
  const [expanded, setExpanded] = useState(false);
  const entities = Object.entries(t.entities).filter(([, v]) => v !== null);
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
            Turn {index} · {t.language} · {(t.classifyMs / 1000).toFixed(1)}s
          </p>
          <p className="mt-1 font-medium">{t.userText}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-xs text-ink-3">Intent correct?</span>
          <button
            onClick={() => onReview(t.intentCorrect === true ? null : true)}
            aria-label="Intent correct"
            aria-pressed={t.intentCorrect === true}
            className={cx(
              'grid size-8 place-items-center rounded-lg border transition',
              t.intentCorrect === true ? 'border-good bg-good text-white' : 'border-line text-ink-3 hover:border-good hover:text-good',
            )}
          >
            <Check className="size-4" strokeWidth={2.6} />
          </button>
          <button
            onClick={() => onReview(t.intentCorrect === false ? null : false)}
            aria-label="Intent incorrect"
            aria-pressed={t.intentCorrect === false}
            className={cx(
              'grid size-8 place-items-center rounded-lg border transition',
              t.intentCorrect === false ? 'border-bad bg-bad text-white' : 'border-line text-ink-3 hover:border-bad hover:text-bad',
            )}
          >
            <X className="size-4" strokeWidth={2.6} />
          </button>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <IntentChip
          nlp={{ intent: t.intent, language: t.language, entities: t.entities, tripContext: {}, handledBy: t.handledBy, classifyMs: t.classifyMs }}
        />
        {entities.map(([k, v]) => (
          <span key={k} className="rounded-md bg-paper-2 px-1.5 py-0.5 text-xs">
            <span className="font-mono text-[10px] uppercase text-ink-3">{k}</span> {String(v)}
          </span>
        ))}
        {t.feedback === 'up' && <ThumbsUp className="size-4 fill-current text-good" />}
        {t.feedback === 'down' && <ThumbsDown className="size-4 fill-current text-bad" />}
      </div>
      <button onClick={() => setExpanded(!expanded)} className="mt-3 block w-full text-left">
        <p className={cx('whitespace-pre-wrap text-sm leading-relaxed text-ink-2', !expanded && 'line-clamp-3')}>
          {t.reply}
        </p>
        <span className="mt-1 inline-block text-xs font-medium text-sea">{expanded ? 'Show less' : 'Show full reply'}</span>
      </button>
    </div>
  );
}
