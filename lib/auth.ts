import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'tm_session';
export const ADMIN_COOKIE = 'tm_admin';

const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

// Derive the signing secret from configured secrets so testers' setup
// needs no extra environment variable. SESSION_SECRET overrides it.
function secret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const material = `${process.env.OPENAI_API_KEY ?? ''}|${process.env.ADMIN_CODE ?? ''}|travelmate`;
  return createHash('sha256').update(material).digest('hex');
}

function sign(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Compare a submitted code with an expected one (case- and space-insensitive). */
export function codeMatches(submitted: string, expected: string | undefined): boolean {
  if (!expected) return false;
  const norm = (s: string) => s.trim().toLowerCase();
  return safeEqual(sign(norm(submitted)), sign(norm(expected)));
}

export function newSessionId(): string {
  return randomUUID();
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE,
};

export async function setSessionCookie(sessionId: string) {
  (await cookies()).set(SESSION_COOKIE, `${sessionId}.${sign(`s:${sessionId}`)}`, cookieOptions);
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Returns the verified session id from the cookie, or null. */
export async function readSessionId(): Promise<string | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;
  const id = raw.slice(0, dot);
  return safeEqual(raw.slice(dot + 1), sign(`s:${id}`)) ? id : null;
}

export async function setAdminCookie() {
  (await cookies()).set(ADMIN_COOKIE, sign('admin'), { ...cookieOptions, maxAge: 60 * 60 * 8 });
}

export async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_CODE) return false;
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!raw && safeEqual(raw, sign('admin'));
}
