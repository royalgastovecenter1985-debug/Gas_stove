import { AdminChrome } from '@/components/admin/AdminChrome';
import { requireAdmin } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { imgSrc } from '@/lib/format';
import { getSettings } from '@/lib/settings';
import { logoutAction } from '../actions/auth';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [s, row] = await Promise.all([
    getSettings(),
    queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM inquiries WHERE status = 'new'"),
  ]);
  return (
    <AdminChrome adminName={admin.name} logo={imgSrc(s.logo)} newInquiries={Number(row?.n ?? 0)} logout={logoutAction}>
      {children}
    </AdminChrome>
  );
}
