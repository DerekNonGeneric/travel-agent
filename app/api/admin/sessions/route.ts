import { isAdmin } from '../../../../lib/auth';
import { deleteSession } from '../../../../lib/store';

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });
  await deleteSession(id);
  return Response.json({ ok: true });
}
