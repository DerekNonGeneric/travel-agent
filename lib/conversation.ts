import type { ModelMessage } from 'ai';
import { mergeTripContext, type TripContext } from '../tripContext';
import type { Session, TravelUIMessage, Turn } from './types';

export const MAX_TURNS = 80;
export const MAX_MESSAGE_LENGTH = 1500;
const HISTORY_TURNS = 20;

export function textOf(message: { parts?: { type: string; text?: string }[] }): string {
  return (message.parts ?? [])
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('')
    .trim();
}

/** Plain-text history for the intent classifier. */
export function historyText(turns: Turn[]): string {
  return turns
    .slice(-HISTORY_TURNS)
    .map((t) => `user: ${t.userText}\nassistant: ${t.reply}`)
    .join('\n');
}

/** Conversation history for the response model. */
export function historyMessages(turns: Turn[]): ModelMessage[] {
  return turns.slice(-HISTORY_TURNS).flatMap((t): ModelMessage[] => [
    { role: 'user', content: t.userText },
    { role: 'assistant', content: t.reply },
  ]);
}

/** Rebuild UI messages from stored turns so a refresh restores the chat. */
export function turnsToMessages(session: Session): TravelUIMessage[] {
  let trip: TripContext = {};
  return session.turns.flatMap((t): TravelUIMessage[] => {
    trip = mergeTripContext(trip, t.entities);
    return [
      { id: t.userMessageId, role: 'user', parts: [{ type: 'text', text: t.userText }] },
      {
        id: t.id,
        role: 'assistant',
        parts: [
          {
            type: 'data-nlp',
            id: 'nlp',
            data: {
              intent: t.intent,
              language: t.language,
              entities: t.entities,
              tripContext: trip,
              handledBy: t.handledBy,
              classifyMs: t.classifyMs,
            },
          },
          { type: 'text', text: t.reply },
        ],
      },
    ];
  });
}
