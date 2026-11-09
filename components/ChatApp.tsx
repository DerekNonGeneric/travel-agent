'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  CloudSun,
  LogOut,
  MessageSquareHeart,
  Plane,
  RotateCcw,
  Square,
  Stamp,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TripContext } from '../tripContext';
import type { Feedback, TravelUIMessage } from '../lib/types';
import { Insights, type InsightItem } from './Insights';
import { AssistantMessage, nlpOf, PendingAssistant, textOfMessage, UserBubble } from './Message';
import { SurveyDialog } from './Survey';
import { TripCard } from './TripCard';
import { cx, Logo, ThemeToggle } from './ui';

const MAX_LENGTH = 1500;
const SURVEY_NUDGE_AFTER = 4;

const suggestions = [
  { icon: Plane, title: 'Find a flight', prompt: 'I want to fly from Miami to San Salvador in December' },
  { icon: CalendarDays, title: 'Plan an itinerary', prompt: 'Plan a 3-day trip to Mexico City for two people' },
  { icon: Wallet, title: 'Estimate a budget', prompt: 'How much money do I need for a week in Paris?' },
  { icon: Stamp, title: 'Check visa rules', prompt: 'Do I need a visa to visit Japan with a US passport?' },
  { icon: UtensilsCrossed, title: 'Discover food', prompt: '¿Qué comida debo probar en Colombia?' },
  { icon: CloudSun, title: 'Pack smart', prompt: 'What should I pack for Costa Rica in the rainy season?' },
];

function errorText(error: Error | undefined): string {
  if (!error) return '';
  try {
    const parsed = JSON.parse(error.message);
    if (parsed?.error) return parsed.error;
  } catch {}
  return error.message && error.message.length < 200
    ? error.message
    : 'Something went wrong. Please try again.';
}

export function ChatApp({
  name,
  initialMessages,
  initialTripContext,
  initialFeedback,
  surveyDone: initialSurveyDone,
}: {
  name: string;
  initialMessages: TravelUIMessage[];
  initialTripContext: TripContext;
  initialFeedback: Record<string, Feedback>;
  surveyDone: boolean;
}) {
  const [transport] = useState(
    () =>
      new DefaultChatTransport<TravelUIMessage>({
        api: '/api/chat',
        // The server keeps the conversation history; send only the new message.
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { message: [...messages].reverse().find((m) => m.role === 'user') },
        }),
      }),
  );

  const { messages, sendMessage, status, stop, error, regenerate, clearError } = useChat<TravelUIMessage>({
    messages: initialMessages,
    transport,
    experimental_throttle: 40,
  });

  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(initialFeedback);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [surveyDone, setSurveyDone] = useState(initialSurveyDone);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [atBottom, setAtBottom] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = status === 'submitted' || status === 'streaming';

  // Latest trip context and per-turn NLP insights, derived from messages.
  const { trip, insights } = useMemo(() => {
    let trip = initialTripContext;
    const insights: InsightItem[] = [];
    let lastUser = '';
    for (const m of messages) {
      if (m.role === 'user') lastUser = textOfMessage(m);
      const nlp = m.role === 'assistant' ? nlpOf(m) : undefined;
      if (nlp) {
        trip = nlp.tripContext;
        insights.push({ id: m.id, userText: lastUser, nlp });
      }
    }
    return { trip, insights };
  }, [messages, initialTripContext]);

  const replies = messages.filter((m) => m.role === 'assistant').length;
  const showNudge = !surveyDone && !nudgeDismissed && replies >= SURVEY_NUDGE_AFTER && !busy;
  const tripSummary =
    trip.origin || trip.destination ? `${trip.origin ?? '?'} → ${trip.destination ?? '?'}` : 'Your trip';

  // Auto-scroll while the user is near the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && atBottom) el.scrollTo({ top: el.scrollHeight, behavior: status === 'streaming' ? 'auto' : 'smooth' });
  }, [messages, status, atBottom]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  function scrollToBottom() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }

  const send = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || busy || value.length > MAX_LENGTH) return;
      clearError();
      setAtBottom(true);
      sendMessage({ text: value });
      setInput('');
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [busy, clearError, sendMessage],
  );

  // Auto-grow the composer.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  async function rate(messageId: string, value: Feedback | null) {
    setFeedback((f) => {
      const next = { ...f };
      if (value) next[messageId] = value;
      else delete next[messageId];
      return next;
    });
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, value }),
    }).catch(() => {});
  }

  async function startOver() {
    if (!window.confirm('Start a new session? Your current chat will be saved, and you’ll return to the welcome screen.'))
      return;
    await fetch('/api/session', { method: 'DELETE' });
    window.location.reload();
  }

  const lastMessage = messages[messages.length - 1];
  const sidePanel = (
    <div className="space-y-4">
      <TripCard trip={trip} name={name} />
      <Insights items={insights} />
    </div>
  );

  return (
    <div className="relative flex h-dvh overflow-hidden">
      <div className="glow pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="z-20 flex items-center justify-between gap-3 border-b border-line/70 bg-paper/75 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-6">
          <Logo responsive />
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex min-w-0 max-w-[13rem] items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium shadow-soft lg:hidden"
            >
              <Plane className="size-3.5 shrink-0 -rotate-45 text-accent" />
              <span className="truncate">{tripSummary}</span>
              <ChevronDown className="size-3.5 shrink-0 text-ink-3" />
            </button>
            <button
              type="button"
              onClick={() => setSurveyOpen(true)}
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-2 transition hover:bg-paper-2 hover:text-ink sm:flex"
            >
              <MessageSquareHeart className="size-4" />
              {surveyDone ? 'Feedback sent' : 'Give feedback'}
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={startOver}
              aria-label="Start a new session"
              title="Start a new session"
              className="grid size-9 place-items-center rounded-full text-ink-2 transition hover:bg-paper-2 hover:text-ink"
            >
              <LogOut className="size-[18px]" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} onScroll={onScroll} className="scrollbar-thin relative flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-6 sm:px-6">
            {messages.length === 0 ? (
              <EmptyState name={name} onPick={send} />
            ) : (
              <div className="space-y-7">
                {messages.map((m, i) =>
                  m.role === 'user' ? (
                    <UserBubble key={m.id} text={textOfMessage(m)} />
                  ) : (
                    <AssistantMessage
                      key={m.id}
                      message={m}
                      streaming={busy && i === messages.length - 1}
                      feedback={feedback[m.id]}
                      onFeedback={(v) => rate(m.id, v)}
                    />
                  ),
                )}
                {busy && lastMessage?.role === 'user' && <PendingAssistant />}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-ink"
                  >
                    <span className="font-medium">{errorText(error)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        clearError();
                        regenerate();
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 font-semibold text-ink shadow-soft"
                    >
                      <RotateCcw className="size-3.5" /> Try again
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="relative z-10 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <AnimatePresence>
            {!atBottom && messages.length > 0 && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                onClick={scrollToBottom}
                aria-label="Scroll to latest message"
                className="absolute -top-12 left-1/2 grid size-9 -translate-x-1/2 place-items-center rounded-full border border-line bg-card text-ink-2 shadow-soft"
              >
                <ArrowDown className="size-4" />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="mx-auto w-full max-w-3xl">
            <AnimatePresence>
              {showNudge && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mb-2.5 flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 shadow-soft">
                    <MessageSquareHeart className="size-5 shrink-0 text-accent" />
                    <p className="flex-1 text-sm text-ink-2">
                      <span className="font-semibold text-ink">Done exploring?</span> Tell us how it went — it takes a minute.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSurveyOpen(true)}
                      className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-paper"
                    >
                      Rate
                    </button>
                    <button
                      type="button"
                      onClick={() => setNudgeDismissed(true)}
                      aria-label="Dismiss"
                      className="grid size-7 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-paper-2"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2 rounded-[26px] border border-line-strong/70 bg-card p-2 pl-4 shadow-float transition focus-within:border-ink-3"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder="Ask about flights, hotels, itineraries…"
                aria-label="Message TravelMate"
                className="max-h-[180px] min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[16px] leading-6 text-ink outline-none placeholder:text-ink-3"
              />
              {busy ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  aria-label="Stop"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-paper transition hover:opacity-90"
                >
                  <Square className="size-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() || input.length > MAX_LENGTH}
                  aria-label="Send"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-white shadow-soft transition hover:brightness-105 disabled:bg-line-strong disabled:text-ink-3 disabled:shadow-none"
                >
                  <ArrowUp className="size-5" strokeWidth={2.4} />
                </button>
              )}
            </form>
            <p className="mt-2 px-2 text-center text-[11.5px] leading-snug text-ink-3">
              {input.length > MAX_LENGTH - 200 ? (
                <span className={input.length > MAX_LENGTH ? 'font-medium text-bad' : ''}>
                  {input.length}/{MAX_LENGTH} characters
                </span>
              ) : (
                'TravelMate is an AI assistant — prices and travel rules are estimates. Please don’t share personal details.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop side panel */}
      <aside className="scrollbar-thin relative hidden w-[380px] shrink-0 overflow-y-auto border-l border-line/70 bg-paper-2/40 p-5 lg:block">
        {sidePanel}
      </aside>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setSheetOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => info.offset.y > 120 && setSheetOpen(false)}
              className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[28px] bg-paper px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-float"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line-strong" />
              {sidePanel}
              <button
                type="button"
                onClick={() => {
                  setSheetOpen(false);
                  setSurveyOpen(true);
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-3 text-sm font-semibold"
              >
                <MessageSquareHeart className="size-4 text-accent" />
                {surveyDone ? 'Feedback sent — edit answers' : 'Give feedback'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SurveyDialog open={surveyOpen} onClose={() => setSurveyOpen(false)} onDone={() => setSurveyDone(true)} />
    </div>
  );
}

function EmptyState({ name, onPick }: { name: string; onPick: (text: string) => void }) {
  return (
    <div className="flex min-h-[calc(100dvh-14rem)] flex-col justify-center py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Welcome aboard, {name}</p>
        <h1 className="mt-3 font-display text-[2.4rem] font-semibold leading-[1.05] tracking-tight sm:text-[3.2rem]">
          Where would you
          <br />
          like to <em className="font-medium italic text-accent">travel</em>?
        </h1>
        <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-ink-2">
          I can help you explore destinations, plan trips, estimate travel costs, and discover exciting places to
          visit. Ask in English or Spanish — or pick an idea below.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
        {suggestions.map((s, i) => (
          <motion.button
            key={s.title}
            type="button"
            onClick={() => onPick(s.prompt)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-start gap-3 rounded-2xl border border-line bg-card/80 p-4 text-left shadow-soft backdrop-blur transition-colors hover:border-line-strong"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-paper-2 text-ink-2 transition group-hover:bg-accent group-hover:text-white">
              <s.icon className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{s.title}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-ink-3">{s.prompt}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
