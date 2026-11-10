'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';

export type FormState = { error?: string; errors?: string[]; ok?: string } | null;
type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

/**
 * Admin form bound to a Server Action. Shows returned errors and keeps what was typed
 * (React would otherwise reset the form after every action).
 */
export function ActionForm(props: {
  action: Action;
  className?: string;
  children: React.ReactNode;
  /** Adjust the FormData before it is sent (e.g. attach files kept in state). */
  prepare?: (fd: FormData) => void;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(props.action, null);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.error || state?.errors?.length) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [state]);

  return (
    <form
      ref={ref}
      className={props.className}
      aria-busy={pending}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        props.prepare?.(fd);
        startTransition(() => formAction(fd));
      }}
    >
      {state?.error && <div className="alert alert--err span-all">{state.error}</div>}
      {state?.errors?.map((x) => <div key={x} className="alert alert--err span-all">{x}</div>)}
      {state?.ok && <div className="alert alert--ok span-all">{state.ok}</div>}
      <fieldset disabled={pending} className="plain-fieldset">{props.children}</fieldset>
    </form>
  );
}

/** Submit button that asks for confirmation first (for deletes). */
export function ConfirmButton({ message, className, children, title }: { message: string; className?: string; children: React.ReactNode; title?: string }) {
  return (
    <button type="submit" className={className} title={title} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}

/** File input for one image, with a live preview of the current or newly chosen picture. */
export function ImageInput({ name, current, label, hint, accept = 'image/jpeg,image/png,image/webp', square = false }: {
  name: string;
  current?: string | null;
  label: string;
  hint?: string;
  accept?: string;
  square?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const src = preview ?? current ?? null;
  return (
    <div className="image-input">
      <span className="image-input__label">{label}</span>
      <label className={`image-input__box${square ? ' is-square' : ''}`}>
        {src ? <img src={src} alt="" /> : <span className="image-input__empty">No image</span>}
        <span className="image-input__btn">{src ? 'Replace' : 'Choose image'}</span>
        <input type="file" name={name} accept={accept} onChange={(e) => {
          const f = e.target.files?.[0];
          setPreview(f ? URL.createObjectURL(f) : null);
        }} />
      </label>
      {hint && <small className="muted">{hint}</small>}
    </div>
  );
}

/** Status dropdown that saves as soon as it changes. */
export function AutoSubmitSelect({ name, defaultValue, options, className }: { name: string; defaultValue: string; options: string[]; className?: string }) {
  return (
    <select name={name} defaultValue={defaultValue} className={className} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
      {options.map((o) => <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>)}
    </select>
  );
}
