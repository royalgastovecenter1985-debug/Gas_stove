'use client';

import { loginAction } from '@/app/admin/actions/auth';
import { ActionForm } from './ui';

export function LoginForm() {
  return (
    <ActionForm action={loginAction}>
      <label>Username<input name="username" required autoComplete="username" autoFocus /></label>
      <label>Password<input type="password" name="password" required autoComplete="current-password" /></label>
      <button className="btn btn--gold btn--block">Sign in</button>
    </ActionForm>
  );
}
