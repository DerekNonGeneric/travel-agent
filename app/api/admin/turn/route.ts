import { isAdmin } from '../../../../lib/auth';
import { getSession, saveSession } from '../../../../lib/store';

/** Record whether the detected intent for a turn was correct. */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { sessionId?: string; turnId?: string; intentCorrect?: boolean | null }
    | null;
  const session = body?.sessionId ? await getSession(body.sessionId) : null;
  const turn = session?.turns.find((t) => t.id === body?.turnId);
  if (!session || !turn) return Response.json({ error: 'Not found' }, { status: 404 });

  if (typeof body?.intentCorrect === 'boolean') turn.intentCorrect = body.intentCorrect;
  else delete turn.intentCorrect;

  await saveSession(session);
  return Response.json({ ok: true });
}
