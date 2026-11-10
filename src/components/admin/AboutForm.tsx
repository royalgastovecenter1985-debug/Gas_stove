'use client';

import { useState } from 'react';
import { saveAbout } from '@/app/admin/actions/settings';
import { Icon } from '@/components/Icon';
import { ABOUT_ICONS, type AboutContent } from '@/lib/settings-schema';
import { ActionForm, ImageInput } from './ui';

export function AboutForm({ about, photoUrls }: { about: AboutContent; photoUrls: Record<'photoMain' | 'photoSide1' | 'photoSide2' | 'boardImage', string> }) {
  const [values, setValues] = useState(about.values);
  const set = (i: number, k: 'icon' | 'title' | 'text', v: string) => setValues(values.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  return (
    <ActionForm action={saveAbout} className="form-layout">
      <div>
        <section className="panel">
          <h2>Page heading</h2>
          <label>Title<input name="pageTitle" maxLength={160} defaultValue={about.pageTitle} /></label>
          <label>Intro line<textarea name="pageIntro" rows={2} maxLength={400} defaultValue={about.pageIntro} /></label>
        </section>

        <section className="panel">
          <h2>Our story</h2>
          <label>Heading<input name="heading" maxLength={160} defaultValue={about.heading} /></label>
          <label>Text <small className="muted">(blank line = new paragraph · wrap words in **double stars** to make them bold)</small>
            <textarea name="body" rows={12} maxLength={8000} defaultValue={about.body} />
          </label>
        </section>

        <section className="panel">
          <h2>Values</h2>
          <label>Section heading<input name="valuesTitle" maxLength={120} defaultValue={about.valuesTitle} /></label>
          {values.map((v, i) => (
            <div className="value-row" key={i}>
              <select name="value_icon" value={v.icon} onChange={(e) => set(i, 'icon', e.target.value)} aria-label="Icon">
                {ABOUT_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
              <span className="value-row__icon"><Icon name={v.icon} size={20} /></span>
              <input name="value_title" placeholder="Title" maxLength={80} value={v.title} onChange={(e) => set(i, 'title', e.target.value)} />
              <textarea name="value_text" placeholder="Short description" rows={2} maxLength={400} value={v.text} onChange={(e) => set(i, 'text', e.target.value)} />
              <button type="button" className="btn btn--ghost btn--sm" aria-label="Remove" onClick={() => setValues(values.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn--outline btn--sm" onClick={() => setValues([...values, { icon: 'check', title: '', text: '' }])}>+ Add value</button>
        </section>

        <section className="panel">
          <h2>What we do</h2>
          <label>Section heading<input name="servicesTitle" maxLength={120} defaultValue={about.servicesTitle} /></label>
          <label>Services <small className="muted">(one per line)</small><textarea name="services" rows={6} defaultValue={about.services.join('\n')} /></label>
          <p className="small muted">The “Who we serve” list comes from Website settings.</p>
        </section>

        <section className="panel">
          <h2>Showroom &amp; workshop</h2>
          <label>Section heading<input name="workshopTitle" maxLength={120} defaultValue={about.workshopTitle} /></label>
          <label>Intro<input name="workshopIntro" maxLength={400} defaultValue={about.workshopIntro} /></label>
          <label>Showroom landline <small className="muted">(shown with the mobile numbers from Website settings)</small><input name="showroomLandline" maxLength={40} defaultValue={about.showroomLandline} /></label>
          <div className="grid-2">
            <label>Workshop name<input name="workshopName" maxLength={120} defaultValue={about.workshopName} /></label>
            <label>Workshop role<input name="workshopRole" maxLength={120} defaultValue={about.workshopRole} /></label>
            <label className="span-2">Workshop address<input name="workshopAddress" maxLength={300} defaultValue={about.workshopAddress} /></label>
            <label className="span-2">Workshop phones <small className="muted">(separate with commas)</small><input name="workshopPhones" maxLength={200} defaultValue={about.workshopPhones} /></label>
          </div>
          <label>Bottom banner heading<input name="ctaTitle" maxLength={160} defaultValue={about.ctaTitle} /></label>
        </section>
      </div>

      <aside>
        <section className="panel">
          <h2>Photos</h2>
          <ImageInput name="photoMain" label="Main photo (tall)" current={photoUrls.photoMain} />
          <label>Main photo caption<input name="photoMainCaption" maxLength={120} defaultValue={about.photoMainCaption} /></label>
          <div className="grid-2">
            <ImageInput name="photoSide1" label="Side photo 1" current={photoUrls.photoSide1} />
            <ImageInput name="photoSide2" label="Side photo 2" current={photoUrls.photoSide2} />
          </div>
          <ImageInput name="boardImage" label="Business board / wide photo" current={photoUrls.boardImage} />
        </section>
        <section className="panel sticky-panel">
          <button className="btn btn--gold btn--block">Save About page</button>
          <a href="/about" target="_blank" rel="noopener" className="btn btn--ghost btn--block">View About page ↗</a>
        </section>
      </aside>
    </ActionForm>
  );
}
