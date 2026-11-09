import { clearSessionCookie, codeMatches, newSessionId, setSessionCookie } from '../../../lib/auth';
import { saveSession } from '../../../lib/store';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { code?: string; name?: string } | null;
  const code = String(body?.code ?? '');
  const name = String(body?.name ?? '').trim().slice(0, 40);

  if (!process.env.ACCESS_CODE) {
    return Response.json({ error: 'This site is not configured yet (missing ACCESS_CODE).' }, { status: 500 });
  }
  if (!name) return Response.json({ error: 'Please enter your first name.' }, { status: 400 });

  if (!codeMatches(code, process.env.ACCESS_CODE)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return Response.json({ error: "That access code doesn't look right." }, { status: 401 });
  }

  const now = Date.now();
  const id = newSessionId();
  await saveSession({ id, name, createdAt: now, updatedAt: now, tripContext: {}, turns: [] });
  await setSessionCookie(id);
  return Response.json({ ok: true });
}

/** Sign out / start a brand-new test session. */
export async function DELETE() {
  await clearSessionCookie();
  return Response.json({ ok: true });
}
