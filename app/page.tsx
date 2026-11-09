import { readSessionId } from '../lib/auth';
import { turnsToMessages } from '../lib/conversation';
import { getSession } from '../lib/store';
import { ChatApp } from '../components/ChatApp';
import { Gate } from '../components/Gate';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const sessionId = await readSessionId();
  const session = sessionId ? await getSession(sessionId) : null;

  if (!session) return <Gate />;

  const feedback = Object.fromEntries(
    session.turns.filter((t) => t.feedback).map((t) => [t.id, t.feedback!]),
  );

  return (
    <ChatApp
      name={session.name}
      initialMessages={turnsToMessages(session)}
      initialTripContext={session.tripContext}
      initialFeedback={feedback}
      surveyDone={!!session.survey}
    />
  );
}
