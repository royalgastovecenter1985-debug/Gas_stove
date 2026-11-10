/** One-time message passed in the URL by admin actions (?ok=… / ?err=…). */
export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const ok = typeof sp.ok === 'string' ? sp.ok : '';
  const err = typeof sp.err === 'string' ? sp.err : '';
  return (
    <>
      {ok && <div className="alert alert--ok">{ok}</div>}
      {err && <div className="alert alert--err">{err}</div>}
    </>
  );
}

export type SP = Promise<Record<string, string | string[] | undefined>>;

export const spStr = (sp: Record<string, string | string[] | undefined>, k: string) => {
  const v = sp[k];
  return (Array.isArray(v) ? v[0] : v ?? '').trim();
};
