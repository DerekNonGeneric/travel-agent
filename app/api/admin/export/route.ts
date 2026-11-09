import { isAdmin } from '../../../../lib/auth';
import { listSessions } from '../../../../lib/store';

function csvCell(value: unknown): string {
  const s = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 });

  const format = new URL(req.url).searchParams.get('format') === 'csv' ? 'csv' : 'json';
  const sessions = await listSessions();
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === 'json') {
    return new Response(JSON.stringify(sessions, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="travelmate-results-${stamp}.json"`,
      },
    });
  }

  const header = [
    'tester', 'session_id', 'turn', 'timestamp', 'language', 'user_message', 'detected_intent',
    'intent_correct', 'handled_by', 'origin', 'destination', 'departure_date', 'return_date',
    'budget', 'passengers', 'classify_ms', 'feedback', 'reply',
  ];
  const rows = sessions.flatMap((s) =>
    s.turns.map((t, i) =>
      [
        s.name, s.id, i + 1, new Date(t.createdAt).toISOString(), t.language, t.userText, t.intent,
        t.intentCorrect === undefined ? '' : t.intentCorrect ? 'yes' : 'no', t.handledBy,
        t.entities.origin, t.entities.destination, t.entities.departureDate, t.entities.returnDate,
        t.entities.budget, t.entities.passengers, t.classifyMs, t.feedback, t.reply,
      ].map(csvCell).join(','),
    ),
  );

  return new Response([header.join(','), ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="travelmate-turns-${stamp}.csv"`,
    },
  });
}
