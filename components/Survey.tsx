'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Check, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cx, Spinner } from './ui';

function Stars({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="grid size-10 place-items-center rounded-xl transition hover:bg-paper-2"
          >
            <Star
              className={cx('size-7 transition', on ? 'scale-105 fill-accent text-accent' : 'text-line-strong')}
              strokeWidth={1.6}
            />
          </button>
        );
      })}
    </div>
  );
}

const rememberOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'partly', label: 'Partly' },
  { value: 'no', label: 'No' },
] as const;

export function SurveyDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [overall, setOverall] = useState(0);
  const [ease, setEase] = useState(0);
  const [remembered, setRemembered] = useState<'yes' | 'partly' | 'no' | null>(null);
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'form' | 'sending' | 'done'>('form');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function submit() {
    if (!overall || !ease || !remembered) {
      setError('Please answer the three quick questions.');
      return;
    }
    setError(null);
    setState('sending');
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overall, easeOfUse: ease, rememberedContext: remembered, comment }),
      });
      if (!res.ok) throw new Error();
      setState('done');
      onDone();
    } catch {
      setState('form');
      setError("Couldn't send your answers. Please try again.");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="survey-title"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-line bg-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-float sm:max-w-lg sm:rounded-[28px] sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-ink-3 transition hover:bg-paper-2 hover:text-ink"
            >
              <X className="size-[18px]" />
            </button>

            {state === 'done' ? (
              <div className="py-6 text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="mx-auto grid size-16 place-items-center rounded-full bg-good text-white"
                >
                  <Check className="size-8" strokeWidth={3} />
                </motion.div>
                <h2 className="mt-5 font-display text-2xl font-semibold">Thank you! ✈️</h2>
                <p className="mx-auto mt-2 max-w-xs text-ink-2">
                  Your feedback helps us improve TravelMate. You can keep chatting as long as you like.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 rounded-xl bg-ink px-5 py-3 font-semibold text-paper transition hover:opacity-90"
                >
                  Back to chat
                </button>
              </div>
            ) : (
              <>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">1-minute survey</p>
                <h2 id="survey-title" className="mt-2 font-display text-2xl font-semibold tracking-tight">
                  How was your experience?
                </h2>

                <div className="mt-6 space-y-6">
                  <div>
                    <p className="mb-2 text-[15px] font-medium">Overall, how helpful was TravelMate?</p>
                    <Stars value={overall} onChange={setOverall} label="Overall helpfulness" />
                  </div>
                  <div>
                    <p className="mb-2 text-[15px] font-medium">How easy was it to use?</p>
                    <Stars value={ease} onChange={setEase} label="Ease of use" />
                  </div>
                  <div>
                    <p className="mb-2 text-[15px] font-medium">Did it remember details you mentioned earlier?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {rememberOptions.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setRemembered(o.value)}
                          aria-pressed={remembered === o.value}
                          className={cx(
                            'rounded-xl border px-3 py-2.5 text-sm font-medium transition',
                            remembered === o.value
                              ? 'border-ink bg-ink text-paper'
                              : 'border-line bg-paper text-ink-2 hover:border-line-strong',
                          )}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-[15px] font-medium">
                      Anything we should improve? <span className="font-normal text-ink-3">(optional)</span>
                    </span>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder="What did you like? What was confusing?"
                      className="w-full resize-none rounded-xl border border-line bg-paper px-4 py-3 text-[15px] outline-none transition placeholder:text-ink-3 focus:border-ink-3 focus:ring-4 focus:ring-accent/15"
                    />
                  </label>
                </div>

                {error && <p className="mt-4 text-sm font-medium text-accent-ink">{error}</p>}

                <button
                  type="button"
                  onClick={submit}
                  disabled={state === 'sending'}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 font-semibold text-white shadow-soft transition hover:brightness-105 disabled:opacity-70"
                >
                  {state === 'sending' && <Spinner />}
                  Send feedback
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
