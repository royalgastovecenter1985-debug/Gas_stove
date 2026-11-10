'use client';

import { changePassword, saveSettings } from '@/app/admin/actions/settings';
import { SETTING_GROUPS, SETTINGS } from '@/lib/settings-schema';
import { ActionForm, ImageInput } from './ui';

const INPUT_TYPE: Record<string, string> = { email: 'email', url: 'url', tel: 'tel', number: 'number', time: 'time', text: 'text' };

export function SettingsForm({ values, logoUrl, faviconUrl, brochureUrl, brochureIsDefault }: {
  values: Record<string, string>;
  logoUrl: string;
  faviconUrl: string;
  brochureUrl: string | null;
  brochureIsDefault: boolean;
}) {
  const groups = Object.entries(SETTING_GROUPS) as [keyof typeof SETTING_GROUPS, string][];
  return (
    <div className="form-layout">
      <ActionForm action={saveSettings}>
        <section className="panel">
          <h2>Logo &amp; icon</h2>
          <div className="grid-2">
            <div>
              <ImageInput name="logo" label="Logo" current={logoUrl} square hint="PNG with transparent background works best. Shown in the header, footer and loader." />
              <label className="check small"><input type="checkbox" name="reset_logo" /> Reset to the original logo</label>
            </div>
            <div>
              <ImageInput name="favicon" label="Browser tab icon (favicon)" current={faviconUrl} square hint="Square PNG, at least 64 × 64." />
              <label className="check small"><input type="checkbox" name="reset_favicon" /> Reset to the original icon</label>
            </div>
          </div>
        </section>

        {groups.map(([g, title]) => (
          <section className="panel" key={g}>
            <h2>{title}</h2>
            <div className="grid-2">
              {SETTINGS.filter((d) => d.group === g).map((d) => (
                <label key={d.key} className={d.type === 'textarea' ? 'span-2' : ''}>
                  {d.label}{d.help && <small className="muted"> — {d.help}</small>}
                  {d.type === 'textarea'
                    ? <textarea name={d.key} rows={2} defaultValue={values[d.key] ?? ''} />
                    : <input name={d.key} type={INPUT_TYPE[d.type]} defaultValue={values[d.key] ?? ''} step={d.type === 'number' ? 'any' : undefined} />}
                </label>
              ))}
            </div>
            {g === 'contact' && (
              <p className="small muted">
                Tip: to get the map position, open Google Maps, right-click your shop and click the numbers at the top of the menu to copy them
                (the first number is latitude, the second longitude).
              </p>
            )}
          </section>
        ))}

        <section className="panel">
          <h2>Brochure PDF</h2>
          <p className="small muted">
            {brochureUrl ? <>Current brochure: <a href="/brochure" target="_blank" rel="noopener">download</a>{brochureIsDefault ? ' (original file)' : ''}.</> : 'No brochure uploaded — the Brochure buttons send visitors to the contact form.'}
          </p>
          <label>Upload a new brochure (PDF, max 25 MB)<input type="file" name="brochure" accept="application/pdf" /></label>
        </section>

        <div className="save-bar">
          <button className="btn btn--gold">Save settings</button>
          <span className="small muted">Changes appear on the website immediately.</span>
        </div>
      </ActionForm>

      <aside>
        <section className="panel">
          <h2>Change password</h2>
          <ActionForm action={changePassword}>
            <label>Current password<input type="password" name="current_password" required autoComplete="current-password" /></label>
            <label>New password<input type="password" name="new_password" required minLength={10} autoComplete="new-password" /></label>
            <label>Confirm new password<input type="password" name="confirm_password" required minLength={10} autoComplete="new-password" /></label>
            <p className="small muted">At least 10 characters with letters and numbers.</p>
            <button className="btn btn--gold btn--block">Update password</button>
          </ActionForm>
        </section>
      </aside>
    </div>
  );
}
