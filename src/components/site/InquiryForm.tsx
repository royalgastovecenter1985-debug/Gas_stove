'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { toast } from '@/lib/client-events';
import { BUSINESS, EMAIL_RE, PHONE_RE } from '@/lib/format';

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'message', string>>;

const WA_DONE = 'WhatsApp opened with your details — tap Send in WhatsApp to send your inquiry.';

/**
 * Inquiry form. On submit it opens WhatsApp with every detail pre-filled (to the number in
 * Admin → Settings) and saves a copy to Admin → Inquiries. Without JavaScript the form posts
 * to /api/inquiry, which saves it and redirects to WhatsApp.
 */
export function InquiryForm(props: {
  formId: string;
  source: string;
  product?: string;
  productOptions: string[];
  waNumber: string;
  onSent?: () => void;
}) {
  const { formId, source, product = '', productOptions, waNumber, onSent } = props;
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [ts] = useState(() => Math.floor(Date.now() / 1000));
  const id = (f: string) => `${formId}-${f}`;

  function buildWaUrl(v: Record<string, string>): string {
    if (!waNumber) return '';
    const lines = [`Hello ${BUSINESS}, I would like a quote.`, '', `*Name:* ${v.name}`, `*Mobile:* ${v.phone}`];
    if (v.email) lines.push(`*Email:* ${v.email}`);
    if (v.city) lines.push(`*City:* ${v.city}`);
    if (v.product) lines.push(`*Product:* ${v.product}`);
    if (v.message) lines.push(`*Requirement:* ${v.message}`);
    lines.push('', `Sent from: ${location.href.split('#')[0]}`);
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const v = Object.fromEntries(Object.entries(data).map(([k, x]) => [k, String(x).trim()]));

    const errs: Errors = {};
    if (v.name.length < 2) errs.name = 'Please enter your name.';
    if (!PHONE_RE.test(v.phone)) errs.phone = 'Please enter a valid 10-digit mobile number.';
    if (v.email && !EMAIL_RE.test(v.email)) errs.email = 'Please enter a valid email address.';
    setErrors(errs);
    setStatus(null);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      (form.elements.namedItem(first) as HTMLInputElement | null)?.focus();
      return;
    }

    // window.open must run synchronously in the submit handler or browsers block it as a pop-up.
    const waUrl = buildWaUrl(v);
    let waWin: Window | null = null;
    if (waUrl) {
      waWin = window.open(waUrl, '_blank');
      if (waWin) waWin.opener = null;
    }

    setBusy(true);
    let msg = WA_DONE;
    let ok = true;
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...v, source }),
      });
      const json = (await res.json()) as { ok: boolean; message: string; errors?: Errors };
      if (!waUrl) {
        ok = json.ok;
        msg = json.message;
        if (json.errors) setErrors(json.errors);
      }
    } catch {
      if (!waUrl) {
        ok = false;
        msg = 'Network error. Please call or WhatsApp us instead.';
      }
    } finally {
      setBusy(false);
    }
    setStatus({ ok, msg });
    if (ok) {
      form.reset();
      toast(msg);
      onSent?.();
      if (waUrl && !waWin) window.location.href = waUrl; // pop-up blocked: open WhatsApp in this tab
    }
  }

  const field = (name: keyof Errors | 'city', label: string, input: React.ReactNode, full = false) => (
    <div className={`field${full ? ' field--full' : ''}${errors[name as keyof Errors] ? ' has-error' : ''}`}>
      <label htmlFor={id(name)}>{label}</label>
      {input}
      {name !== 'city' && <small className="field__error">{errors[name as keyof Errors] ?? ''}</small>}
    </div>
  );

  return (
    <form ref={formRef} className="inquiry-form" action="/api/inquiry" method="post" noValidate onSubmit={onSubmit}>
      <div className="hp" aria-hidden="true">
        <label>Leave this empty<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <input type="hidden" name="ts" value={ts} />
      <input type="hidden" name="source" value={source} />

      <div className="form-grid">
        {field('name', 'Your name *', <input id={id('name')} name="name" type="text" required maxLength={120} autoComplete="name" />)}
        {field('phone', 'Mobile number *', <input id={id('phone')} name="phone" type="tel" required maxLength={18} autoComplete="tel" inputMode="tel" />)}
        {field('email', 'Email', <input id={id('email')} name="email" type="email" maxLength={160} autoComplete="email" />)}
        {field('city', 'City', <input id={id('city')} name="city" type="text" maxLength={100} autoComplete="address-level2" />)}
        <div className="field field--full">
          <label htmlFor={id('product')}>Product of interest</label>
          <input id={id('product')} name="product" type="text" maxLength={200} list={id('products')} defaultValue={product}
            placeholder="e.g. Double Dom Burner, SS Sink" />
          <datalist id={id('products')}>
            {productOptions.map((o) => <option key={o} value={o} />)}
            <option value="Complete kitchen setup" />
          </datalist>
        </div>
        {field('message', 'Requirement', <textarea id={id('message')} name="message" rows={3} maxLength={2000} placeholder="Quantity, size, fuel type, delivery location…" />, true)}
      </div>
      <button type="submit" className={`btn btn--wa btn--block${busy ? ' is-loading' : ''}`} disabled={busy}>
        <Icon name="whatsapp" size={18} /> <span className="btn__label">Send Inquiry on WhatsApp</span>
      </button>
      <div className={`form-status${status ? (status.ok ? ' is-ok' : ' is-err') : ''}`} role="status" aria-live="polite">{status?.msg}</div>
    </form>
  );
}
