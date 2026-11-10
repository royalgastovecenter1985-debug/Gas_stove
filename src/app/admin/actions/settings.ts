'use server';

import { redirect } from 'next/navigation';
import { str, withFlash, type FormState } from '@/lib/admin';
import { hashPassword, requireAdmin, startSession, verifyPassword } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import { EMAIL_RE } from '@/lib/format';
import { ABOUT_DEFAULT, ABOUT_ICONS, ABOUT_KEY, FILE_SETTINGS, SETTINGS, type AboutContent } from '@/lib/settings-schema';
import { getSettings } from '@/lib/settings';
import { deleteUpload, isFile, savePdf, saveImage, UploadError } from '@/lib/uploads';

async function putSetting(key: string, value: string, label: string | null = null, group = 'general') {
  await execute(
    'INSERT INTO settings (`key`, `value`, `label`, `group`) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
    [key, value, label, group],
  );
}

/* ---------------- Website settings ---------------- */

export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const errors: string[] = [];
  const values: [string, string, string | null, string][] = [];

  for (const def of SETTINGS) {
    if (!fd.has(def.key)) continue;
    let v = str(fd, def.key, 5000);
    if (def.type === 'url' && v && !/^https?:\/\//i.test(v)) { errors.push(`${def.label} must start with http:// or https://`); continue; }
    if (def.type === 'email' && v && !EMAIL_RE.test(v)) { errors.push(`${def.label} is not a valid e-mail address.`); continue; }
    if (def.key === 'whatsapp') {
      v = v.replace(/\D/g, '');
      if (v.length === 10) v = '91' + v; // Indian mobile without country code
      if (v.length < 11) { errors.push('WhatsApp number must include the country code, e.g. 919998327943.'); continue; }
    }
    if (def.key === 'phone_1' && !v) { errors.push('Phone 1 cannot be empty.'); continue; }
    if (def.type === 'time' && v && !/^\d{2}:\d{2}$/.test(v)) { errors.push(`${def.label} must look like 09:30.`); continue; }
    values.push([def.key, v, def.label, def.group]);
  }
  if (errors.length) return { errors };

  // Uploaded files: logo, favicon, brochure
  const s = await getSettings();
  const replaced: string[] = [];
  try {
    const logo = fd.get('logo');
    if (isFile(logo)) { values.push(['logo', await saveImage(logo, 'brand', 600), 'Logo', 'general']); replaced.push(s.logo); }
    const fav = fd.get('favicon');
    if (isFile(fav)) { values.push(['favicon', await saveImage(fav, 'brand', 512), 'Favicon', 'general']); replaced.push(s.favicon); }
    const pdf = fd.get('brochure');
    if (isFile(pdf)) { values.push(['brochure_file', await savePdf(pdf, 'pdf'), 'Brochure PDF', 'general']); replaced.push(s.brochure_file); }
  } catch (e) {
    return { error: e instanceof UploadError ? e.message : 'Could not save the uploaded file.' };
  }
  for (const k of ['logo', 'favicon'] as const) {
    if (fd.get(`reset_${k}`) && !values.some(([key]) => key === k)) { values.push([k, FILE_SETTINGS[k], null, 'general']); replaced.push(s[k]); }
  }

  for (const [k, v, label, group] of values) await putSetting(k, v, label, group);
  await Promise.all(replaced.map(deleteUpload)); // only removes files under assets/uploads
  redirect(withFlash('/admin/settings', 'ok', 'Settings saved. The website is updated.'));
}

/* ---------------- Change password ---------------- */

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const row = await queryOne<{ password_hash: string }>('SELECT password_hash FROM admin_users WHERE id = ?', [admin.id]);
  const next = String(fd.get('new_password') ?? '');
  if (!row || !(await verifyPassword(String(fd.get('current_password') ?? ''), row.password_hash))) {
    return { error: 'Current password is incorrect.' };
  }
  if (next.length < 10 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) {
    return { error: 'New password must be at least 10 characters and include letters and numbers.' };
  }
  if (next !== fd.get('confirm_password')) return { error: 'New passwords do not match.' };
  const hash = await hashPassword(next);
  await execute('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, admin.id]);
  await startSession(admin.id, hash); // other sessions are signed out; this one stays signed in
  return { ok: 'Password changed.' };
}

/* ---------------- About page content ---------------- */

export async function saveAbout(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const s = await getSettings();
  let current: AboutContent = ABOUT_DEFAULT;
  try { current = { ...ABOUT_DEFAULT, ...(s[ABOUT_KEY] ? JSON.parse(s[ABOUT_KEY]) : {}) }; } catch { /* keep defaults */ }

  const text = (k: keyof AboutContent, max = 300) => str(fd, k, max);
  const icons = fd.getAll('value_icon').map(String);
  const titles = fd.getAll('value_title').map((x) => String(x).trim());
  const texts = fd.getAll('value_text').map((x) => String(x).trim());
  const values = titles
    .map((title, i) => ({ icon: (ABOUT_ICONS as readonly string[]).includes(icons[i]) ? icons[i] : 'check', title: title.slice(0, 80), text: (texts[i] ?? '').slice(0, 400) }))
    .filter((v) => v.title);

  const next: AboutContent = {
    ...current,
    pageTitle: text('pageTitle', 160) || ABOUT_DEFAULT.pageTitle,
    pageIntro: text('pageIntro', 400),
    heading: text('heading', 160),
    body: text('body', 8000),
    photoMainCaption: text('photoMainCaption', 120),
    valuesTitle: text('valuesTitle', 120),
    values,
    servicesTitle: text('servicesTitle', 120),
    services: str(fd, 'services', 4000).split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
    workshopTitle: text('workshopTitle', 120),
    workshopIntro: text('workshopIntro', 400),
    showroomLandline: text('showroomLandline', 40),
    workshopName: text('workshopName', 120),
    workshopRole: text('workshopRole', 120),
    workshopAddress: text('workshopAddress', 300),
    workshopPhones: text('workshopPhones', 200),
    ctaTitle: text('ctaTitle', 160),
  };

  const replaced: string[] = [];
  try {
    for (const key of ['photoMain', 'photoSide1', 'photoSide2', 'boardImage'] as const) {
      const f = fd.get(key);
      if (isFile(f)) {
        replaced.push(next[key]);
        next[key] = await saveImage(f, 'about', 1600);
      }
    }
  } catch (e) {
    return { error: e instanceof UploadError ? e.message : 'Could not save the photo.' };
  }

  await putSetting(ABOUT_KEY, JSON.stringify(next), 'About page content', 'content');
  await Promise.all(replaced.map(deleteUpload));
  redirect(withFlash('/admin/about', 'ok', 'About page saved.'));
}
