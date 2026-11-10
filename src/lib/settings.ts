import 'server-only';
import { cache } from 'react';
import { query } from './db';
import { ABOUT_DEFAULT, ABOUT_KEY, FILE_SETTINGS, SETTINGS, type AboutContent } from './settings-schema';

export type Settings = Record<string, string>;

const DEFAULTS: Settings = {
  ...Object.fromEntries(SETTINGS.map((s) => [s.key, s.default])),
  ...FILE_SETTINGS,
};

/** All settings, read once per request. Empty values fall back to defaults only where noted. */
export const getSettings = cache(async (): Promise<Settings> => {
  const out: Settings = { ...DEFAULTS };
  try {
    const rows = await query<{ key: string; value: string | null }>('SELECT `key`, `value` FROM settings');
    for (const r of rows) out[r.key] = r.value ?? '';
  } catch (e) {
    console.error('settings:', e);
  }
  // Files must always resolve to something displayable.
  for (const [k, v] of Object.entries(FILE_SETTINGS)) if (!out[k]) out[k] = v;
  return out;
});

export function phones(s: Settings): string[] {
  return [s.phone_1, s.phone_2, s.phone_3].map((p) => (p || '').trim()).filter(Boolean);
}

export function socialLinks(s: Settings): { key: 'instagram' | 'facebook' | 'google'; label: string; href: string }[] {
  const all = [
    { key: 'instagram' as const, label: 'Instagram', href: s.instagram_url },
    { key: 'facebook' as const, label: 'Facebook', href: s.facebook_url },
    { key: 'google' as const, label: 'Google reviews', href: s.google_url },
  ];
  return all.filter((x) => !!x.href);
}

export function clientList(s: Settings): string[] {
  return (s.client_list || '').split('|').map((x) => x.trim()).filter(Boolean);
}

export const getAbout = cache(async (): Promise<AboutContent> => {
  const s = await getSettings();
  try {
    const saved = s[ABOUT_KEY] ? (JSON.parse(s[ABOUT_KEY]) as Partial<AboutContent>) : {};
    return { ...ABOUT_DEFAULT, ...saved };
  } catch {
    return ABOUT_DEFAULT;
  }
});

/** "Open now" badge: Mon–Sat between open_time and close_time, India time. */
export function isOpenNow(s: Settings, now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  if (get('weekday') === 'Sun') return false;
  const hm = `${get('hour').replace('24', '00')}:${get('minute')}`;
  return hm >= (s.open_time || '09:30') && hm < (s.close_time || '20:30');
}
