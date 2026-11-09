import {
  BedDouble,
  CalendarDays,
  CircleQuestionMark,
  CircleSlash,
  CloudSun,
  Compass,
  Hand,
  Landmark,
  LifeBuoy,
  Plane,
  Stamp,
  TrainFront,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { TravelIntent } from '../intents';

type Meta = { label: string; icon: LucideIcon; tone: 'travel' | 'system' | 'warn' };

export const intentMeta: Record<TravelIntent, Meta> = {
  greeting: { label: 'Greeting', icon: Hand, tone: 'system' },
  help: { label: 'Help', icon: LifeBuoy, tone: 'system' },
  flight_search: { label: 'Flight search', icon: Plane, tone: 'travel' },
  hotel_search: { label: 'Hotel search', icon: BedDouble, tone: 'travel' },
  destination_recommendation: { label: 'Destination ideas', icon: Compass, tone: 'travel' },
  itinerary_planning: { label: 'Itinerary planning', icon: CalendarDays, tone: 'travel' },
  travel_budget: { label: 'Travel budget', icon: Wallet, tone: 'travel' },
  attractions: { label: 'Attractions', icon: Landmark, tone: 'travel' },
  transportation: { label: 'Transportation', icon: TrainFront, tone: 'travel' },
  visa_requirements: { label: 'Visa & passport', icon: Stamp, tone: 'travel' },
  food_recommendations: { label: 'Food & dining', icon: UtensilsCrossed, tone: 'travel' },
  weather_packing: { label: 'Weather & packing', icon: CloudSun, tone: 'travel' },
  unknown: { label: 'Unclear request', icon: CircleQuestionMark, tone: 'warn' },
  off_topic: { label: 'Off-topic', icon: CircleSlash, tone: 'warn' },
};

export const languageLabel = { en: 'English', es: 'Español', other: 'Other' } as const;

export const entityLabels: Record<string, string> = {
  origin: 'From',
  destination: 'To',
  departureDate: 'Depart',
  returnDate: 'Return',
  passengers: 'Travelers',
  budget: 'Budget',
};

export function formatEntity(key: string, value: unknown): string {
  if (key === 'budget' && typeof value === 'number') {
    return `$${value.toLocaleString('en-US')}`;
  }
  return String(value);
}
