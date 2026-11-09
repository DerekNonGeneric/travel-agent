import type { UIMessage } from 'ai';
import type { TravelEntities, Language } from '../classifyIntent';
import type { TravelIntent } from '../intents';
import type { TripContext } from '../tripContext';

export type NlpData = {
  intent: TravelIntent;
  language: Language;
  entities: TravelEntities;
  tripContext: TripContext;
  handledBy: 'model' | 'rule';
  classifyMs: number;
};

export type TravelUIMessage = UIMessage<never, { nlp: NlpData }>;

export type Feedback = 'up' | 'down';

export type Turn = {
  id: string; // assistant message id
  userMessageId: string;
  userText: string;
  reply: string;
  intent: TravelIntent;
  language: Language;
  entities: TravelEntities;
  handledBy: 'model' | 'rule';
  classifyMs: number;
  createdAt: number;
  feedback?: Feedback;
  /** Set by an evaluator in the admin dashboard. */
  intentCorrect?: boolean;
};

export type Survey = {
  overall: number; // 1–5
  rememberedContext: 'yes' | 'partly' | 'no';
  easeOfUse: number; // 1–5
  comment: string;
  submittedAt: number;
};

export type Session = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tripContext: TripContext;
  turns: Turn[];
  survey?: Survey;
};
