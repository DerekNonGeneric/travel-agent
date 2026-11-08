import { openai } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { intents } from './intents';

const classificationSchema = z.object({
  intent: z.enum(intents),
  entities: z.object({
    origin: z.string().nullable(),
    destination: z.string().nullable(),
    departureDate: z.string().nullable(),
    returnDate: z.string().nullable(),
    budget: z.number().nullable(),
    passengers: z.number().nullable(),
  }),
});

export type Classification = z.infer<typeof classificationSchema>;
export type TravelEntities = Classification['entities'];

export async function classifyIntent(
  userInput: string,
  history: string,
): Promise<Classification> {
  const { output } = await generateText({
    model: openai('gpt-5.1'),
    output: Output.object({ schema: classificationSchema }),
    system: `
You classify messages for a travel chatbot.

Choose exactly one intent from the provided enum:
- greeting: hello, hi, good morning
- help: questions about chatbot capabilities
- flight_search: flights and airfare
- hotel_search: accommodation and lodging
- destination_recommendation: where to travel
- itinerary_planning: planning a trip schedule
- travel_budget: estimating trip expenses
- attractions: tourist sites and activities
- transportation: buses, trains, taxis, routes
- visa_requirements: passports and entry rules
- food_recommendations: travel dining
- weather_packing: destination weather or packing
- unknown: unclear or ambiguous travel-related requests
- off_topic: unrelated to travel

Use the conversation history to understand follow-ups (e.g. "are there
cheaper options?" after a flight discussion is flight_search).
Extract travel entities from the current message and from relevant,
established conversation context.

Use null for information that is not provided.
Do not invent dates, budgets, or destinations.
Do not convert an ambiguous date into a precise date.
`,
    prompt: `
Conversation history:
${history || '(none)'}

Current user message:
${userInput}
`,
  });

  return output;
}
