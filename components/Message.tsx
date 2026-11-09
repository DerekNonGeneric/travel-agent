'use client';

import { motion } from 'motion/react';
import { Check, Copy, ThumbsDown, ThumbsUp } from 'lucide-react';
import { memo, useState } from 'react';
import { Streamdown } from 'streamdown';
import type { Feedback, NlpData, TravelUIMessage } from '../lib/types';
import { IntentChip } from './Insights';
import { cx, Logo } from './ui';

export function nlpOf(message: TravelUIMessage): NlpData | undefined {
  for (const part of message.parts) if (part.type === 'data-nlp') return part.data;
  return undefined;
}

export function textOfMessage(message: TravelUIMessage): string {
  return message.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { text: string }).text)
    .join('');
}

function Thinking({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-accent"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </span>
      <span className="shimmer text-sm font-medium">{label}</span>
    </div>
  );
}

export function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
      className="flex justify-end"
    >
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-[22px] rounded-br-md bg-ink px-4 py-2.5 text-[15px] leading-relaxed text-paper shadow-soft sm:max-w-[75%]">
        {text}
      </div>
    </motion.div>
  );
}

export function PendingAssistant() {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0">
        <Logo compact />
      </div>
      <Thinking label="Reading your message…" />
    </div>
  );
}

export const AssistantMessage = memo(function AssistantMessage({
  message,
  streaming,
  feedback,
  onFeedback,
}: {
  message: TravelUIMessage;
  streaming: boolean;
  feedback?: Feedback;
  onFeedback: (value: Feedback | null) => void;
}) {
  const nlp = nlpOf(message);
  const text = textOfMessage(message);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group flex gap-3"
    >
      <div className="mt-0.5 shrink-0">
        <Logo compact />
      </div>
      <div className="min-w-0 flex-1">
        {nlp && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-2 flex flex-wrap items-center gap-2"
          >
            <IntentChip nlp={nlp} />
            {nlp.handledBy === 'rule' && (
              <span className="text-[11px] text-ink-3">Fixed reply</span>
            )}
          </motion.div>
        )}

        {text ? (
          <div className="prose-chat text-ink">
            <Streamdown mode={streaming ? 'streaming' : 'static'} isAnimating={streaming} controls={false}>
              {text}
            </Streamdown>
          </div>
        ) : (
          streaming && <Thinking label={nlp ? 'Planning your answer…' : 'Reading your message…'} />
        )}

        {!streaming && text && (
          <div
            className={cx(
              'mt-2 flex items-center gap-0.5 transition-opacity',
              feedback ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100',
            )}
          >
            <IconButton
              label="Helpful"
              active={feedback === 'up'}
              activeClass="text-good bg-good/10"
              onClick={() => onFeedback(feedback === 'up' ? null : 'up')}
            >
              <ThumbsUp className={cx('size-4', feedback === 'up' && 'fill-current')} />
            </IconButton>
            <IconButton
              label="Not helpful"
              active={feedback === 'down'}
              activeClass="text-bad bg-bad/10"
              onClick={() => onFeedback(feedback === 'down' ? null : 'down')}
            >
              <ThumbsDown className={cx('size-4', feedback === 'down' && 'fill-current')} />
            </IconButton>
            <IconButton label={copied ? 'Copied' : 'Copy'} onClick={copy}>
              {copied ? <Check className="size-4 text-good" /> : <Copy className="size-4" />}
            </IconButton>
          </div>
        )}
      </div>
    </motion.div>
  );
});

function IconButton({
  label,
  onClick,
  active,
  activeClass,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cx(
        'grid size-8 place-items-center rounded-lg text-ink-3 transition hover:bg-paper-2 hover:text-ink',
        active && activeClass,
      )}
    >
      {children}
    </button>
  );
}
