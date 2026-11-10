'use server';

import { redirect } from 'next/navigation';
import type { FormState } from '@/lib/admin';
import { endSession, loginThrottled, recordLoginFailure, startSession, verifyPassword } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { clientIp } from '@/lib/request';

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (await loginThrottled(ip)) return { error: 'Too many failed attempts. Please wait 15 minutes and try again.' };

  const username = String(fd.get('username') ?? '').trim();
  const password = String(fd.get('password') ?? '');
  const user = username
    ? await queryOne<{ id: number; password_hash: string }>('SELECT id, password_hash FROM admin_users WHERE username = ?', [username])
    : null;
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    await recordLoginFailure(ip);
    return { error: 'Incorrect username or password.' };
  }
  await startSession(user.id, user.password_hash);
  redirect('/admin');
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect('/admin/login');
}
