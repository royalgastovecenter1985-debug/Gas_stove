'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { EV_INQUIRY } from '@/lib/client-events';
import { InquiryForm } from './InquiryForm';

/** "Quick inquiry" dialog, opened by any element with data-quick-inquiry (see SiteEffects). */
export function InquiryModal({ waNumber, productOptions }: { waNumber: string; productOptions: string[] }) {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState('');
  const [nonce, setNonce] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      lastFocus.current = document.activeElement as HTMLElement | null;
      setProduct((e as CustomEvent<{ product?: string }>).detail?.product ?? '');
      setNonce((n) => n + 1); // remount the form so the product field is pre-filled
      openRef.current = true;
      setOpen(true);
    };
    window.addEventListener(EV_INQUIRY, onOpen);
    return () => window.removeEventListener(EV_INQUIRY, onOpen);
  }, []);

  const openRef = useRef(false);
  openRef.current = open;
  const close = () => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    lastFocus.current?.focus?.();
  };

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) return;
    const t = setTimeout(() => ref.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  // Keyboard handling is attached once, so Escape works even right after the dialog opens.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!openRef.current) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && ref.current) {
        const f = Array.from(ref.current.querySelectorAll<HTMLElement>('button, [href], input:not([type=hidden]):not([tabindex="-1"]), textarea, select'))
          .filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal" id="inquiryModal" role="dialog" aria-modal="true" aria-labelledby="inquiryModalTitle" hidden={!open} ref={ref}>
      <div className="modal__backdrop" onClick={close} />
      <div className="modal__dialog">
        <button className="modal__close" onClick={close} aria-label="Close"><Icon name="close" size={20} /></button>
        <p className="kicker">Quick inquiry</p>
        <h2 className="modal__title" id="inquiryModalTitle">{product ? `Inquiry: ${product}` : 'Get the best wholesale price'}</h2>
        <p className="muted">Tell us what you need — our team calls back within business hours.</p>
        <InquiryForm key={nonce} formId="modal" source="quick-inquiry" product={product} productOptions={productOptions}
          waNumber={waNumber} onSent={() => setTimeout(close, 2200)} />
      </div>
    </div>
  );
}
