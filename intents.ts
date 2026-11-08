export const intents = [
  'greeting',
  'help',
  'flight_search',
  'hotel_search',
  'destination_recommendation',
  'itinerary_planning',
  'travel_budget',
  'attractions',
  'transportation',
  'visa_requirements',
  'food_recommendations',
  'weather_packing',
  'unknown',
  'off_topic',
] as const;

export type TravelIntent = (typeof intents)[number];
