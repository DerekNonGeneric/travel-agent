import { Redis } from '@upstash/redis';
import type { Session } from './types';

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

/** True when sessions survive restarts (Redis is configured). */
export const isPersistent = redis !== null;

const SESSION_KEY = (id: string) => `tm:session:${id}`;
const INDEX_KEY = 'tm:sessions';

// In-memory fallback for local development. Kept on globalThis so it
// survives Next.js hot reloads.
const memory: Map<string, Session> =
  ((globalThis as Record<string, unknown>).__travelmateSessions as Map<string, Session>) ??
  ((globalThis as Record<string, unknown>).__travelmateSessions = new Map<string, Session>());

export async function getSession(id: string): Promise<Session | null> {
  if (redis) return (await redis.get<Session>(SESSION_KEY(id))) ?? null;
  return memory.get(id) ?? null;
}

export async function saveSession(session: Session): Promise<void> {
  session.updatedAt = Date.now();
  if (redis) {
    await Promise.all([
      redis.set(SESSION_KEY(session.id), session),
      redis.zadd(INDEX_KEY, { score: session.createdAt, member: session.id }),
    ]);
    return;
  }
  memory.set(session.id, session);
}

export async function listSessions(): Promise<Session[]> {
  if (redis) {
    const ids = await redis.zrange<string[]>(INDEX_KEY, 0, -1, { rev: true });
    if (ids.length === 0) return [];
    const sessions = await redis.mget<(Session | null)[]>(...ids.map(SESSION_KEY));
    return sessions.filter((s): s is Session => s !== null);
  }
  return [...memory.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteSession(id: string): Promise<void> {
  if (redis) {
    await Promise.all([redis.del(SESSION_KEY(id)), redis.zrem(INDEX_KEY, id)]);
    return;
  }
  memory.delete(id);
}
