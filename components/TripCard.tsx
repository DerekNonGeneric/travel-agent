'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Plane } from 'lucide-react';
import type { TripContext } from '../tripContext';
import { cx } from './ui';

function Field({ label, value, className }: { label: string; value?: string; className?: string }) {
  return (
    <div className={cx('min-w-0', className)}>
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</p>
      <div className="relative mt-1 h-6 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={value ?? '—'}
            initial={{ y: 14, opacity: 0, filter: 'blur(4px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={cx('truncate text-[15px] font-semibold', value ? 'text-ink' : 'text-ink-3/60')}
            title={value}
          >
            {value ?? '—'}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

function City({ label, value, align }: { label: string; value?: string; align: 'left' | 'right' }) {
  const len = value?.length ?? 3;
  const size =
    len <= 8 ? 'text-[1.7rem] leading-9' : len <= 16 ? 'text-[1.2rem] leading-[1.15]' : 'text-[1.02rem] leading-[1.15]';
  return (
    <div className={cx('min-w-0 flex-1', align === 'right' && 'text-right')}>
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</p>
      <div className={cx('relative mt-1 flex min-h-[2.6rem] overflow-hidden', align === 'right' ? 'items-end justify-end' : 'items-end')}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={value ?? 'empty'}
            initial={{ y: 22, opacity: 0, filter: 'blur(6px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: -22, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={cx(
              'line-clamp-2 break-words font-display font-semibold tracking-tight',
              size,
              value ? 'text-ink' : 'text-ink-3/50',
            )}
            title={value}
          >
            {value ?? '???'}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function TripCard({ trip, name }: { trip: TripContext; name: string }) {
  const filled = Object.values(trip).filter((v) => v !== null && v !== undefined).length;
  const hasRoute = !!(trip.origin || trip.destination);

  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-card shadow-soft">
      <div className="relative flex items-center justify-between bg-ink px-5 py-3 text-paper">
        <div className="flex items-center gap-2">
          <Plane className="size-4 -rotate-45" />
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]">Your trip</span>
        </div>
        <span className="font-mono text-[11px] text-paper/70">{filled}/6 details</span>
        <div
          className="absolute bottom-0 left-0 h-[3px] bg-accent transition-all duration-700"
          style={{ width: `${(filled / 6) * 100}%` }}
        />
      </div>

      <div className="px-5 pb-4 pt-4">
        <div className="flex items-end gap-3">
          <City label="From" value={trip.origin ?? undefined} align="left" />
          <div className="mb-2.5 flex shrink-0 items-center gap-1 text-ink-3">
            <span className="h-px w-5 border-t border-dashed border-line-strong" />
            <motion.span
              animate={hasRoute ? { x: [0, 3, 0] } : {}}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Plane className={cx('size-4 rotate-45', hasRoute ? 'text-accent' : 'text-ink-3')} />
            </motion.span>
            <span className="h-px w-5 border-t border-dashed border-line-strong" />
          </div>
          <City label="To" value={trip.destination ?? undefined} align="right" />
        </div>
      </div>

      <div className="relative">
        <div className="perforation h-1" />
        <span className="absolute -left-2.5 top-1/2 size-5 -translate-y-1/2 rounded-full border border-line bg-paper" />
        <span className="absolute -right-2.5 top-1/2 size-5 -translate-y-1/2 rounded-full border border-line bg-paper" />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 px-5 pb-5 pt-4">
        <Field label="Depart" value={trip.departureDate ?? undefined} />
        <Field label="Return" value={trip.returnDate ?? undefined} />
        <Field
          label="Travelers"
          value={trip.passengers ? `${trip.passengers} ${trip.passengers === 1 ? 'person' : 'people'}` : undefined}
        />
        <Field label="Budget" value={trip.budget ? `$${trip.budget.toLocaleString('en-US')}` : undefined} />
        <div className="col-span-2 flex items-center justify-between border-t border-dashed border-line pt-3">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">Passenger</p>
            <p className="mt-0.5 text-[15px] font-semibold capitalize">{name}</p>
          </div>
          <Barcode seed={name} />
        </div>
      </div>

      {filled === 0 && (
        <p className="border-t border-line bg-paper-2/60 px-5 py-3 text-[13px] leading-relaxed text-ink-2">
          I&apos;ll fill this in as we chat — try telling me where you&apos;re flying from and to.
        </p>
      )}
    </div>
  );
}

function Barcode({ seed }: { seed: string }) {
  const bars = Array.from({ length: 28 }, (_, i) => {
    const c = seed.charCodeAt(i % Math.max(seed.length, 1)) || 7;
    return ((c * (i + 3)) % 3) + 1;
  });
  return (
    <div className="flex h-8 items-stretch gap-[2px] opacity-80" aria-hidden>
      {bars.map((w, i) => (
        <span key={i} className="bg-ink" style={{ width: w }} />
      ))}
    </div>
  );
}
