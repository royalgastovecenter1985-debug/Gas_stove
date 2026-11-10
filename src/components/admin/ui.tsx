'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';

import { upload } from '@vercel/blob/client';
import { UPLOADS_URL } from '@/lib/format';

export type FormState = { error?: string; errors?: string[]; ok?: string } | null;
type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

const isRealFile = (v: FormDataEntryValue): v is File => typeof v !== 'string' && v.size > 0;
const hasFiles = (fd: FormData) => [...fd.values()].some(isRealFile);

/**
 * On Vercel a request can carry only ~4.5 MB, so each chosen file is first uploaded straight to
 * Vercel Blob from the browser and the form sends "blob:<url>" in its place (the server action
 * reads it back — see resolveUploads). Order of repeated fields (several photos) is kept.
 */
async function uploadFilesToBlob(fd: FormData, onStatus: (msg: string) => void): Promise<FormData> {
  const entries = [...fd.entries()];
  const files = entries.map(([, v]) => v).filter(isRealFile);
  const loaded = new Map<File, number>();
  const total = files.reduce((a, f) => a + f.size, 0);
  const report = () => {
    const done = [...loaded.values()].reduce((a, b) => a + b, 0);
    onStatus(`Uploading ${files.length > 1 ? `${files.length} files` : 'file'}… ${Math.min(99, Math.round((done / total) * 100))}%`);
  };
  report();
  const urls = new Map<File, string>();
  await Promise.all(
    files.map(async (file) => {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(-80) || 'upload';
      const blob = await upload(`tmp/${safe}`, file, {
        access: 'public',
        handleUploadUrl: '/admin/upload',
        contentType: file.type || undefined,
        multipart: file.size > 8 * 1024 * 1024,
        onUploadProgress: ({ loaded: n }) => { loaded.set(file, n); report(); },
      });
      urls.set(file, blob.url);
    }),
  );
  onStatus('Saving…');
  const out = new FormData();
  for (const [k, v] of entries) out.append(k, isRealFile(v) ? `blob:${urls.get(v)}` : v);
  return out;
}

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
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.error || state?.errors?.length) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [state]);

  return (
    <form
      ref={ref}
      className={props.className}
      aria-busy={pending || !!uploading}
      onSubmit={async (e) => {
        e.preventDefault();
        let fd = new FormData(e.currentTarget);
        props.prepare?.(fd);
        setUploadError(null);
        if (UPLOADS_URL && hasFiles(fd)) {
          try {
            fd = await uploadFilesToBlob(fd, setUploading);
          } catch (err) {
            setUploadError(`Upload failed: ${err instanceof Error ? err.message : 'please try again.'}`);
            ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          } finally {
            setUploading(null);
          }
        }
        startTransition(() => formAction(fd));
      }}
    >
      {uploadError && <div className="alert alert--err span-all">{uploadError}</div>}
      {state?.error && <div className="alert alert--err span-all">{state.error}</div>}
      {state?.errors?.map((x) => <div key={x} className="alert alert--err span-all">{x}</div>)}
      {state?.ok && <div className="alert alert--ok span-all">{state.ok}</div>}
      {uploading && <div className="alert span-all" role="status">{uploading}</div>}
      <fieldset disabled={pending || !!uploading} className="plain-fieldset">{props.children}</fieldset>
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
