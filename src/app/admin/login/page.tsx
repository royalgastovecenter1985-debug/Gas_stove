import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/LoginForm';
import { getAdmin } from '@/lib/auth';
import { imgSrc } from '@/lib/format';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Sign in' };

export default async function LoginPage() {
  if (await getAdmin()) redirect('/admin');
  const s = await getSettings();
  return (
    <div className="login-page">
      <div className="login-card">
        <img src={imgSrc(s.logo)} alt="" width={84} height={84} />
        <h1>Admin panel</h1>
        <p className="muted">{s.site_name}</p>
        <LoginForm />
        <a href="/" className="muted small">← Back to website</a>
      </div>
    </div>
  );
}
