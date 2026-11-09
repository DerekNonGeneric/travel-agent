import { isAdmin } from '../../lib/auth';
import { isPersistent, listSessions } from '../../lib/store';
import { AdminDashboard, AdminLogin } from '../../components/Admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Results · TravelMate AI' };

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin configured={!!process.env.ADMIN_CODE} />;
  const sessions = await listSessions();
  return <AdminDashboard sessions={sessions} persistent={isPersistent} />;
}
