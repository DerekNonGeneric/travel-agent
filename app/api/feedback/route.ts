import { readSessionId } from '../../../lib/auth';
import { getSession, saveSession } from '../../../lib/store';

export async function POST(req: Request) {
  const sessionId = await readSessionId();
  const session = sessionId ? await getSession(sessionId) : null;
  if (!session) return Response.json({ error: 'Session expired.' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { messageId?: string; value?: string | null } | null;
  const turn = session.turns.find((t) => t.id === body?.messageId);
  if (!turn) return Response.json({ error: 'Message not found.' }, { status: 404 });

  if (body?.value === 'up' || body?.value === 'down') turn.feedback = body.value;
  else delete turn.feedback;

  await saveSession(session);
  return Response.json({ ok: true });
}
