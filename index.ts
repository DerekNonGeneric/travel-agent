import { openai } from '@ai-sdk/openai';
import { ModelMessage, streamText } from 'ai';
import 'dotenv/config';
import * as readline from 'node:readline/promises';
import { classifyIntent, TravelEntities } from './classifyIntent';
import { greeting, travelAgentSystemPrompt } from './systemPrompt';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

// Trip details remembered across turns (conversational context).
const tripContext: Partial<TravelEntities> = {};

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

const offTopicResponse =
  "I'm sorry, but I specialize in travel assistance. I'd be happy to help " +
  'you plan a trip, find flights, or explore destinations! Where would you like to go?';

const unknownResponse =
  "I'm not sure I understood. Could you clarify your travel question? " +
  'I can help with flights, hotels, itineraries, budgets, and more.';

function updateTripContext(entities: TravelEntities) {
  for (const [key, value] of Object.entries(entities)) {
    if (value !== null) {
      (tripContext as Record<string, unknown>)[key] = value;
    }
  }
}

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
      updateTripContext(classification.entities);

      console.log('\n[NLP Intent]:', classification.intent);
      console.log('[NLP Entities]:', JSON.stringify(classification.entities));
      console.log('[Trip context]:', JSON.stringify(tripContext));

      messages.push({ role: 'user', content: text });

      let fixedResponse: string | null = null;
      if (classification.intent === 'off_topic') fixedResponse = offTopicResponse;
      if (classification.intent === 'unknown') fixedResponse = unknownResponse;
      if (classification.intent === 'help') fixedResponse = helpText.trim();

      if (fixedResponse !== null) {
        console.log(`\nTravelMate: ${fixedResponse}\n`);
        messages.push({ role: 'assistant', content: fixedResponse });
        continue;
      }

      const result = streamText({
        model: openai('gpt-5.1'),
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
