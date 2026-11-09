import { openai } from '@ai-sdk/openai';
import { ModelMessage, streamText } from 'ai';
import 'dotenv/config';
import * as readline from 'node:readline/promises';
import { classifyIntent, MODEL_ID } from './classifyIntent';
import { fixedResponse } from './responses';
import { greeting, travelAgentSystemPrompt } from './systemPrompt';
import { mergeTripContext, TripContext } from './tripContext';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

// Trip details remembered across turns (conversational context).
let tripContext: TripContext = {};

const helpText = `
TravelMate can help with:
- Flights and hotels
- Trip itineraries
- Destination recommendations
- Travel budgets
- Attractions and transportation
- Visa and passport information
- Food, weather, and packing

Commands: /help, /context, /exit
`;

async function main() {
  console.log(`\nTravelMate: ${greeting}`);
  console.log('(Type /help for options or /exit to quit.)\n');
  messages.push({ role: 'assistant', content: greeting });

  while (true) {
    const text = (await terminal.question('You: ')).trim();
    if (!text) continue;

    const command = text.toLowerCase();

    if (command === '/exit') {
      console.log('\nTravelMate: Safe travels! Goodbye! ✈️\n');
      break;
    }

    if (command === '/help') {
      console.log(helpText);
      continue;
    }

    if (command === '/context') {
      console.log('\n[Trip context]:', JSON.stringify(tripContext), '\n');
      continue;
    }

    try {
      const history = messages
        .map((m) => `${m.role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
        .join('\n');

      // NLP: intent recognition + named entity recognition
      const classification = await classifyIntent(text, history);
      tripContext = mergeTripContext(tripContext, classification.entities);

      console.log('\n[NLP Intent]:', classification.intent);
      console.log('[NLP Language]:', classification.language);
      console.log('[NLP Entities]:', JSON.stringify(classification.entities));
      console.log('[Trip context]:', JSON.stringify(tripContext));

      messages.push({ role: 'user', content: text });

      const fixed = fixedResponse(classification.intent, classification.language);
      if (fixed !== null) {
        console.log(`\nTravelMate: ${fixed}\n`);
        messages.push({ role: 'assistant', content: fixed });
        continue;
      }

      const result = streamText({
        model: openai(MODEL_ID),
        system:
          travelAgentSystemPrompt +
          `
Detected intent: ${classification.intent}
Known trip details: ${JSON.stringify(tripContext)}
Use this classification and context as helpful information.
`,
        messages,
      });

      let fullResponse = '';
      process.stdout.write('\nTravelMate: ');
      for await (const delta of result.textStream) {
        fullResponse += delta;
        process.stdout.write(delta);
      }
      process.stdout.write('\n\n');

      messages.push({ role: 'assistant', content: fullResponse });
    } catch (error) {
      console.error('Chatbot error:', error);
      console.log('Please try your message again.\n');
    }
  }

  terminal.close();
}

main().catch(console.error);
