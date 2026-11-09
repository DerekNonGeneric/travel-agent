import type { TravelEntities } from './classifyIntent';

export type TripContext = Partial<TravelEntities>;

/** Merge newly extracted entities into the remembered trip details. */
export function mergeTripContext(previous: TripContext, entities: TravelEntities): TripContext {
  const next: TripContext = { ...previous };
  for (const [key, value] of Object.entries(entities) as [keyof TravelEntities, unknown][]) {
    if (value !== null && value !== undefined && value !== '') {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}
