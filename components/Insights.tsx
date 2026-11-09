'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Brain } from 'lucide-react';
import { entityLabels, formatEntity, intentMeta, languageLabel } from '../lib/intent-meta';
import type { NlpData } from '../lib/types';
import { cx } from './ui';

export type InsightItem = { id: string; userText: string; nlp: NlpData };

export function IntentChip({ nlp, className }: { nlp: NlpData; className?: string }) {
  const meta = intentMeta[nlp.intent];
  const Icon = meta.icon;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        meta.tone === 'travel' && 'border-sea/25 bg-sea-soft text-sea',
        meta.tone === 'system' && 'border-line bg-paper-2 text-ink-2',
        meta.tone === 'warn' && 'border-accent/25 bg-accent-soft text-accent-ink',
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.2} />
      {meta.label}
    </span>
  );
}

function EntityChips({ entities }: { entities: NlpData['entities'] }) {
  const found = Object.entries(entities).filter(([, v]) => v !== null);
  if (found.length === 0) return <p className="text-xs text-ink-3">No trip details in this message</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {found.map(([k, v]) => (
        <span key={k} className="inline-flex items-baseline gap-1 rounded-md bg-paper-2 px-1.5 py-0.5 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{entityLabels[k] ?? k}</span>
          <span className="font-medium text-ink">{formatEntity(k, v)}</span>
        </span>
      ))}
    </div>
  );
}

export function Insights({ items }: { items: InsightItem[] }) {
  return (
    <div className="rounded-[22px] border border-line bg-card/80 p-4 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-accent" />
          <h2 className="text-sm font-semibold">How I understood you</h2>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-good opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-good" />
          </span>
          Live NLP
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 px-1 text-[13px] leading-relaxed text-ink-2">
          For each message, I detect your <strong className="font-medium text-ink">intent</strong>, pull out{' '}
          <strong className="font-medium text-ink">trip details</strong> like cities and dates, and connect follow-up
          questions to what you said earlier.
        </p>
      ) : (
        <ol className="mt-3 space-y-2">
          <AnimatePresence initial={false}>
            {[...items].reverse().map((item, i) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                className={cx(
                  'rounded-2xl border p-3',
                  i === 0 ? 'border-line-strong bg-card' : 'border-transparent bg-paper-2/50',
                )}
              >
                <p className="line-clamp-2 text-[13px] leading-snug text-ink-2">&ldquo;{item.userText}&rdquo;</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <IntentChip nlp={item.nlp} />
                  <span className="text-[11px] text-ink-3">
                    {languageLabel[item.nlp.language]} · {(item.nlp.classifyMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="mt-2">
                  <EntityChips entities={item.nlp.entities} />
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </div>
  );
}
