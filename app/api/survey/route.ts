import { readSessionId } from '../../../lib/auth';
import { getSession, saveSession } from '../../../lib/store';

const clamp = (n: unknown) => Math.min(5, Math.max(1, Math.round(Number(n) || 0)));

export async function POST(req: Request) {
  const sessionId = await readSessionId();
  const session = sessionId ? await getSession(sessionId) : null;
  if (!session) return Response.json({ error: 'Session expired.' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const remembered = body?.rememberedContext;

  session.survey = {
    overall: clamp(body?.overall),
    easeOfUse: clamp(body?.easeOfUse),
    rememberedContext: remembered === 'yes' || remembered === 'partly' || remembered === 'no' ? remembered : 'partly',
    comment: String(body?.comment ?? '').slice(0, 2000),
    submittedAt: Date.now(),
  };
  await saveSession(session);
  return Response.json({ ok: true });
}
