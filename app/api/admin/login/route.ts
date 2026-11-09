import { cookies } from 'next/headers';
import { ADMIN_COOKIE, codeMatches, setAdminCookie } from '../../../../lib/auth';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  if (!process.env.ADMIN_CODE) {
    return Response.json({ error: 'ADMIN_CODE is not configured.' }, { status: 500 });
  }
  if (!codeMatches(String(body?.code ?? ''), process.env.ADMIN_CODE)) {
    await new Promise((r) => setTimeout(r, 600));
    return Response.json({ error: 'Incorrect admin code.' }, { status: 401 });
  }
  await setAdminCookie();
  return Response.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).delete(ADMIN_COOKIE);
  return Response.json({ ok: true });
}
