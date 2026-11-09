import type { Language } from './classifyIntent';

type Localized = Record<'en' | 'es', string>;

const pick = (text: Localized, language: Language) =>
  language === 'es' ? text.es : text.en;

export const helpText: Localized = {
  en: `Here's what I can help with:

- ✈️ **Flights** — routes, airlines, and price estimates
- 🏨 **Hotels** — where to stay for your budget
- 🌎 **Destinations** — ideas based on what you enjoy
- 🗓️ **Itineraries** — day-by-day trip plans
- 💰 **Budgets** — how much a trip might cost
- 📍 **Attractions** — things to see and do
- 🚆 **Transportation** — getting around and airport transfers
- 🛂 **Visas & passports** — general entry requirements
- 🍽️ **Food** — local dishes and where to eat
- 🧳 **Weather & packing** — what to expect and what to bring

Just tell me where you'd like to go!`,
  es: `Esto es lo que puedo hacer por ti:

- ✈️ **Vuelos** — rutas, aerolíneas y precios estimados
- 🏨 **Hoteles** — dónde hospedarte según tu presupuesto
- 🌎 **Destinos** — ideas según lo que te gusta
- 🗓️ **Itinerarios** — planes de viaje día por día
- 💰 **Presupuestos** — cuánto podría costar tu viaje
- 📍 **Atracciones** — qué ver y qué hacer
- 🚆 **Transporte** — cómo moverte y traslados al aeropuerto
- 🛂 **Visas y pasaportes** — requisitos generales de entrada
- 🍽️ **Comida** — platos locales y dónde comer
- 🧳 **Clima y equipaje** — qué esperar y qué llevar

¡Cuéntame a dónde te gustaría ir!`,
};

const offTopic: Localized = {
  en: "I'm sorry, but I specialize in travel assistance. I'd be happy to help you plan a trip, find flights, or explore destinations! Where would you like to go?",
  es: 'Lo siento, pero me especializo en asistencia de viajes. ¡Con gusto te ayudo a planear un viaje, buscar vuelos o descubrir destinos! ¿A dónde te gustaría ir?',
};

const unknown: Localized = {
  en: "I'm not sure I understood. Could you tell me a bit more about your travel question? I can help with flights, hotels, itineraries, budgets, and more.",
  es: 'No estoy seguro de haber entendido. ¿Podrías contarme un poco más sobre tu pregunta de viaje? Puedo ayudarte con vuelos, hoteles, itinerarios, presupuestos y más.',
};

/** Deterministic replies for intents that don't need the language model. */
export function fixedResponse(intent: string, language: Language): string | null {
  if (intent === 'off_topic') return pick(offTopic, language);
  if (intent === 'unknown') return pick(unknown, language);
  if (intent === 'help') return pick(helpText, language);
  return null;
}
