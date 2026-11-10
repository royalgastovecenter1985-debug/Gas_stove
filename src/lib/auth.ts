import 'server-only';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { execute, queryOne } from './db';

const COOKIE = 'rgs_admin';
const SESSION_HOURS = 12;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MIN = 15;

export interface Admin {
  id: number;
  username: string;
  name: string;
  email: string | null;
}

interface Payload {
  uid: number;
  exp: number;
  /** Fingerprint of the password hash: changing the password signs out every session. */
  pv: string;
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET is missing or shorter than 32 characters. Set it in .env.local / your hosting panel.');
  }
  return s;
}

const b64 = (s: string) => Buffer.from(s).toString('base64url');
const sign = (data: string) => crypto.createHmac('sha256', secret()).update(data).digest('base64url');
const fingerprint = (hash: string) => crypto.createHash('sha256').update(hash).digest('base64url').slice(0, 16);

function encode(p: Payload): string {
  const data = b64(JSON.stringify(p));
  return `${data}.${sign(data)}`;
}

function decode(token: string | undefined): Payload | null {
  if (!token) return null;
  const [data, mac] = token.split('.');
  if (!data || !mac) return null;
  const expected = sign(data);
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const p = JSON.parse(Buffer.from(data, 'base64url').toString()) as Payload;
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

/** PHP's password_hash() writes $2y$; bcryptjs reads the identical $2a$ format. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash.replace(/^\$2y\$/, '$2a$'));
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export const getAdmin = cache(async (): Promise<Admin | null> => {
  const store = await cookies();
  const p = decode(store.get(COOKIE)?.value);
  if (!p) return null;
  const row = await queryOne<Admin & { password_hash: string }>(
    'SELECT id, username, name, email, password_hash FROM admin_users WHERE id = ?',
    [p.uid],
  );
  if (!row || fingerprint(row.password_hash) !== p.pv) return null;
  return { id: row.id, username: row.username, name: row.name, email: row.email };
});

/** Use at the top of every admin page and every admin Server Action. */
export async function requireAdmin(): Promise<Admin> {
  const a = await getAdmin();
  if (!a) redirect('/admin/login');
  return a;
}

/** Only callable from Server Actions / Route Handlers (sets a cookie). */
export async function startSession(userId: number, passwordHash: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, encode({ uid: userId, exp: Date.now() + SESSION_HOURS * 3600_000, pv: fingerprint(passwordHash) }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && (process.env.APP_URL || '').startsWith('https://'),
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  });
  await execute('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?', [userId]);
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function loginThrottled(ip: string): Promise<boolean> {
  const row = await queryOne<{ n: number }>(
    `SELECT COUNT(*) AS n FROM login_attempts WHERE ip_address = ? AND attempted_at > NOW() - INTERVAL '${LOGIN_WINDOW_MIN} minutes'`,
    [ip],
  );
  return Number(row?.n ?? 0) >= LOGIN_MAX_ATTEMPTS;
}

export async function recordLoginFailure(ip: string): Promise<void> {
  await execute('INSERT INTO login_attempts (ip_address, attempted_at) VALUES (?, NOW())', [ip]);
  await execute("DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '1 day'");
}
