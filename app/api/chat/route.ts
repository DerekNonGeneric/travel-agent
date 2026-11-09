import { openai } from '@ai-sdk/openai';
import { createUIMessageStream, createUIMessageStreamResponse, generateId, streamText } from 'ai';
import { classifyIntent, MODEL_ID } from '../../../classifyIntent';
import { fixedResponse } from '../../../responses';
import { travelAgentSystemPrompt } from '../../../systemPrompt';
import { mergeTripContext } from '../../../tripContext';
import { readSessionId } from '../../../lib/auth';
import {
  historyMessages,
  historyText,
  MAX_MESSAGE_LENGTH,
  MAX_TURNS,
  textOf,
} from '../../../lib/conversation';
import { getSession, saveSession } from '../../../lib/store';
import type { NlpData, TravelUIMessage } from '../../../lib/types';

export const maxDuration = 60;

const webFormatting = `
FORMATTING (web chat):
- Use Markdown: short paragraphs, bullet lists, and **bold** for key facts.
- For multi-day itineraries use a "### Day 1 — …" heading per day.
- Be brief: aim for 60–150 words. Only write longer replies for full
  itineraries or when the user asks for detail.
- If an essential detail is missing, give a short helpful answer and ask
  for it — don't write long generic guides.
- Do not use tables wider than four columns.
`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function jsonError(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function POST(req: Request) {
  const sessionId = await readSessionId();
  const session = sessionId ? await getSession(sessionId) : null;
  if (!session) return jsonError(401, 'Your session has expired. Please refresh the page.');

  const body = (await req.json().catch(() => null)) as { message?: TravelUIMessage } | null;
  const userMessage = body?.message;
  const userText = userMessage ? textOf(userMessage) : '';

  if (!userMessage || !userText) return jsonError(400, 'Please type a message.');
  if (userText.length > MAX_MESSAGE_LENGTH) {
    return jsonError(413, `Please keep messages under ${MAX_MESSAGE_LENGTH} characters.`);
  }
  if (session.turns.length >= MAX_TURNS) {
    return jsonError(429, "You've reached the message limit for this test session. Thank you for testing!");
  }

  const stream = createUIMessageStream<TravelUIMessage>({
    onError: (error) => {
      console.error('[chat] error', error);
      return 'Sorry, something went wrong on our side. Please try again.';
    },
    execute: async ({ writer }) => {
      const messageId = generateId();
      writer.write({ type: 'start', messageId });

      // NLP: intent recognition, named entity recognition, and
      // contextual reference resolution (via conversation history).
      const started = Date.now();
      const classification = await classifyIntent(userText, historyText(session.turns));
      const classifyMs = Date.now() - started;
      const tripContext = mergeTripContext(session.tripContext, classification.entities);

      const fixed = fixedResponse(classification.intent, classification.language);
      const nlp: NlpData = {
        intent: classification.intent,
        language: classification.language,
        entities: classification.entities,
        tripContext,
        handledBy: fixed !== null ? 'rule' : 'model',
        classifyMs,
      };
      writer.write({ type: 'data-nlp', id: 'nlp', data: nlp });

      let reply = '';
      if (fixed !== null) {
        // Stream the fixed reply word by word so it feels consistent.
        const textId = generateId();
        writer.write({ type: 'text-start', id: textId });
        for (const word of fixed.split(/(?<=\s)/)) {
          writer.write({ type: 'text-delta', id: textId, delta: word });
          await sleep(12);
        }
        writer.write({ type: 'text-end', id: textId });
        writer.write({ type: 'finish' });
        reply = fixed;
      } else {
        const today = new Date().toLocaleDateString('en-US', { dateStyle: 'full' });
        const result = streamText({
          model: openai(MODEL_ID),
          abortSignal: req.signal,
          system:
            travelAgentSystemPrompt +
            webFormatting +
            `
Today's date: ${today}
Detected intent: ${classification.intent}
Known trip details: ${JSON.stringify(tripContext)}
Use this classification and context as helpful information.
`,
          messages: [...historyMessages(session.turns), { role: 'user', content: userText }],
        });
        writer.merge(result.toUIMessageStream({ sendStart: false }));
        reply = await result.text;
      }

      session.tripContext = tripContext;
      session.turns.push({
        id: messageId,
        userMessageId: userMessage.id,
        userText,
        reply,
        intent: classification.intent,
        language: classification.language,
        entities: classification.entities,
        handledBy: nlp.handledBy,
        classifyMs,
        createdAt: Date.now(),
      });
      await saveSession(session);
    },
  });

  return createUIMessageStreamResponse({ stream });
}
